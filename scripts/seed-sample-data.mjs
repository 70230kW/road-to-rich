#!/usr/bin/env node
/**
 * Seeds a room with realistic-looking weekly mahjong history for demoing the
 * dashboard/history/ranking screens.
 *
 * Reads the player list + calculation settings from a SOURCE room (read-only,
 * never written to) and writes generated history into a TARGET room. Refuses
 * to run if source === target, so it can never touch real data.
 *
 * Uses firebase-admin (a service account) rather than the client SDK: the
 * client SDK's API key goes through Google's HTTP-referrer restriction, which
 * (correctly) has no allowance for a bare Node process with no browser
 * referer, so anonymous sign-in fails outside a browser. Admin credentials
 * bypass that entirely and also aren't subject to Firestore security rules.
 *
 * Setup (one-time): Firebase Console > プロジェクトの設定 > サービスアカウント >
 * "新しい秘密鍵の生成" to download a JSON key. Save it outside the repo (or
 * anywhere already gitignored) and never commit it — unlike the web
 * firebaseConfig, this key grants full admin access to your project.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
 *     node scripts/seed-sample-data.mjs \
 *     [--source=funai] [--target=funai-sample] [--start=2025-01-06] [--end=2026-06-30]
 *
 * Local emulator (no service account needed): set FIRESTORE_EMULATOR_HOST
 * (e.g. 127.0.0.1:8080) and FIREBASE_PROJECT_ID before running.
 */
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function parseArgs() {
  const parsed = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const [key, value] = arg.replace(/^--/, '').split('=');
      return [key, value ?? true];
    }),
  );
  return {
    source: parsed.source || 'funai',
    target: parsed.target || 'funai-sample',
    start: parsed.start || '2025-01-06',
    end: parsed.end || '2026-06-30',
  };
}

// ---- calculation helpers (kept in sync with src/lib/calc.ts by hand; this
// script has no build step, so it can't import the TS source directly) ----

function getRankPoints(settings) {
  return settings.playerCount === 4 ? settings.rankPoints4 : settings.rankPoints3;
}

function getExpectedScoreTotal(settings) {
  return settings.initialScore * settings.playerCount;
}

function computeAutoLastScore(otherRawScores, settings) {
  if (otherRawScores.some((s) => s === null || Number.isNaN(s))) return null;
  const sum = otherRawScores.reduce((acc, s) => acc + s, 0);
  return getExpectedScoreTotal(settings) - sum;
}

function calcGameSettlement(entries, settings) {
  const rankPoints = getRankPoints(settings);
  const sorted = [...entries].sort((a, b) => b.rawScore - a.rawScore);
  return sorted.map((entry, idx) => ({
    playerId: entry.playerId,
    rawScore: entry.rawScore,
    rank: idx + 1,
    point: (entry.rawScore + rankPoints[idx] - settings.initialScore) / settings.divider,
  }));
}

function calcTableFeeShare(totalFee, participantCount) {
  if (participantCount <= 0) return 0;
  return Math.ceil(totalFee / participantCount);
}

function calcDaySettlement(games, chips, tableFee, settings) {
  const participantIds = Object.keys(chips);
  const tableFeeShare = calcTableFeeShare(tableFee, participantIds.length);
  const result = {};
  for (const pid of participantIds) {
    const gamesTotal = games.reduce((sum, g) => {
      const score = g.scores.find((s) => s.playerId === pid);
      return sum + (score ? score.point : 0);
    }, 0);
    const chipCount = chips[pid] ?? 0;
    const chipValue = chipCount * settings.chipValue;
    const totalWithoutFee = gamesTotal + chipValue;
    const totalWithFee = totalWithoutFee - tableFeeShare;
    result[pid] = { gamesTotal, chipCount, chipValue, tableFeeShare, totalWithoutFee, totalWithFee };
  }
  return result;
}

// ---- random generation ----

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randHundred(min, max) {
  return randInt(Math.round(min / 100), Math.round(max / 100)) * 100;
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

/** Picks settings.playerCount participants for one day's session out of the full registered pool. */
function pickDayParticipants(playerIds, settings) {
  return shuffle(playerIds).slice(0, settings.playerCount);
}

function generateHanchan(playerIds, settings) {
  const order = shuffle(playerIds);
  const lastIdx = order.length - 1;
  for (let attempt = 0; attempt < 40; attempt++) {
    const manual = order.slice(0, lastIdx).map(() => randHundred(-10000, 60000));
    const last = computeAutoLastScore(manual, settings);
    if (last === null || last < -40000 || last > 110000) continue;
    const entries = order.map((id, i) => ({ playerId: id, rawScore: i === lastIdx ? last : manual[i] }));
    return { id: crypto.randomUUID(), scores: calcGameSettlement(entries, settings) };
  }
  const even = Math.round(getExpectedScoreTotal(settings) / order.length / 100) * 100;
  const entries = order.map((id) => ({ playerId: id, rawScore: even }));
  return { id: crypto.randomUUID(), scores: calcGameSettlement(entries, settings) };
}

function generateTableFee(gamesCount) {
  // 半荘1回あたり概ね1,000円（4人なら1人あたり約250円）を中心にばらつかせ、
  // 遊んだ半荘数に応じて合計する。
  let total = 0;
  for (let i = 0; i < gamesCount; i++) {
    total += randInt(800, 1200);
  }
  return Math.round(total / 100) * 100;
}

function generateChips(playerIds) {
  const values = playerIds.map(() => randInt(-3, 3));
  const sum = values.reduce((a, b) => a + b, 0);
  values[0] -= sum;
  return Object.fromEntries(playerIds.map((id, i) => [id, values[i]]));
}

function initFirestore() {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  if (emulatorHost) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'demo-project';
    initializeApp({ projectId });
    console.log(`[emulator] ${emulatorHost} のローカル Firestore エミュレータに接続します (project: ${projectId})。`);
    return getFirestore();
  }

  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyPath) {
    console.error(
      'サービスアカウントの認証情報が見つかりません。\n' +
        '  1. Firebase Console > プロジェクトの設定 > サービスアカウント > 「新しい秘密鍵の生成」でJSONキーをダウンロード\n' +
        '  2. GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node scripts/seed-sample-data.mjs\n' +
        'の形式で実行してください（このJSONキーは強力な権限を持つため、絶対にリポジトリにコミットしないでください）。',
    );
    process.exit(1);
  }
  initializeApp({ credential: cert(keyPath) });
  return getFirestore();
}

/** Deletes every existing history doc in the target room so re-running the script doesn't pile up alongside old/incorrect data. */
async function clearHistory(historyCol) {
  const snap = await historyCol.get();
  if (snap.empty) return 0;
  const batchSize = 400; // stay under Firestore's 500-write batch limit
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = historyCol.firestore.batch();
    docs.slice(i, i + batchSize).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  return docs.length;
}

async function main() {
  const { source, target, start, end } = parseArgs();

  if (source === target) {
    console.error(`--source と --target が同じです（"${source}"）。実データを上書きしないよう処理を中止します。`);
    process.exit(1);
  }

  const db = initFirestore();

  console.log(`[read] "${source}" の雀士・設定を読み込み中...`);
  const playersSnap = await db.doc(`rooms/${source}/state/players`).get();
  const settingsSnap = await db.doc(`rooms/${source}/state/settings`).get();
  if (!playersSnap.exists || !settingsSnap.exists) {
    throw new Error(`ルーム "${source}" が見つからないか、まだ何も保存されていません。`);
  }
  const players = playersSnap.data().list;
  const settings = settingsSnap.data();
  if (players.length < settings.playerCount) {
    throw new Error(`"${source}" の登録雀士数(${players.length})が対局形式(${settings.playerCount}人)に足りません。`);
  }
  console.log(`  雀士: ${players.map((p) => p.name).join(', ')} (${players.length}名登録)`);
  console.log(
    `  設定: ${settings.playerCount}人麻雀 / 配給原点${settings.initialScore} / 割る数${settings.divider} ` +
      `→ 1日あたり登録雀士の中から${settings.playerCount}名を選んで対局`,
  );

  console.log(`[write] "${target}" に players/settings をコピー中... (source "${source}" は変更しません)`);
  await db.doc(`rooms/${target}/state/players`).set({ list: players });
  await db.doc(`rooms/${target}/state/settings`).set(settings);
  await db.doc(`rooms/${target}/state/currentDay`).set({ games: [] });

  const playerIds = players.map((p) => p.id);
  const historyCol = db.collection(`rooms/${target}/history`);

  const removed = await clearHistory(historyCol);
  if (removed > 0) console.log(`[clear] "${target}" の既存サンプル履歴 ${removed} 件を削除しました。`);

  const startDate = new Date(`${start}T12:00:00Z`);
  const endDate = new Date(`${end}T12:00:00Z`);
  let count = 0;
  for (const d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 7)) {
    const dayParticipants = pickDayParticipants(playerIds, settings);
    const gamesCount = randInt(2, 4);
    const games = Array.from({ length: gamesCount }, () => generateHanchan(dayParticipants, settings));
    const tableFee = generateTableFee(gamesCount);
    const chips = generateChips(dayParticipants);
    const settlement = calcDaySettlement(games, chips, tableFee, settings);

    await historyCol.add({
      date: new Date(d).toISOString(),
      games,
      tableFee,
      chips,
      settlement,
    });
    count++;
    if (count % 10 === 0) console.log(`  ${count} 日分 書き込み済み...`);
  }

  console.log(`\n✅ 完了: "${target}" に ${count} 日分のサンプルデータを作成しました。`);
  console.log(`   アプリでルームコード "${target}" を入力して確認してください。`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ エラー:', err.message);
  process.exit(1);
});
