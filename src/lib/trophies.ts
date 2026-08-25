import type { DayRecord, Game, GameScore, Player, Settings } from '../types';
import { findYakuman } from './yakuman';

export type TrophyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'special' | 'underground' | 'impossible';

export interface TrophyDef {
  id: string;
  tier: TrophyTier;
  name: string;
  description: string;
}

export const TROPHY_TIERS: TrophyTier[] = ['bronze', 'silver', 'gold', 'platinum', 'special', 'underground', 'impossible'];

export const TROPHY_TIER_LABELS: Record<TrophyTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  special: 'Special',
  underground: 'UnderGround',
  impossible: 'Impossible',
};

/**
 * 用語（対局＝各半荘、試合＝その日のセッション＝各半荘の合計）に基づく設計方針:
 * - 「ポイント」は precision に依存しないよう、素点と配給原点の差分を1000で割った値
 *   （伝統的な麻雀の「pt」表記）として扱う。金額換算の精算値（GameScore.point）は
 *   ルーム設定（割る数・ウマオカ）に依存してしまうため使用しない。
 * - 「○試合連続で」のような順位ストリークは、その日の合計ポイントで日ごとに順位付け
 *   した「試合」単位のストリークとして扱う。
 * - 「累計○試合」「通算」のような回数＋確率/平均系の実績は、この計算式が既存の
 *   ランキング機能（平均着順など）と一致するよう、対局（半荘）単位でカウントする。
 * - 平均順位などの閾値系トロフィーは「一度でも到達したら永久に獲得」というトロフィー
 *   ケースらしい仕様にするため、履歴を時系列に辿りながら毎対局後の累積値をチェックする。
 */
function hanchanPt(score: GameScore, settings: Settings): number {
  return (score.rawScore - settings.initialScore) / 1000;
}

function isLastPlace(score: GameScore, game: Game): boolean {
  return score.rank === game.scores.length;
}

function hasConsecutive<T>(seq: T[], length: number, pred: (item: T) => boolean): boolean {
  let streak = 0;
  for (const item of seq) {
    if (pred(item)) {
      streak += 1;
      if (streak >= length) return true;
    } else {
      streak = 0;
    }
  }
  return false;
}

function everCumulativeAtLeast(seq: { pt: number }[], threshold: number): boolean {
  let running = 0;
  for (const h of seq) {
    running += h.pt;
    if (running >= threshold) return true;
  }
  return false;
}

function everCumulativeAvgRankAtMost(seq: { score: GameScore }[], minCount: number, maxAvg: number): boolean {
  let rankSum = 0;
  for (let i = 0; i < seq.length; i++) {
    rankSum += seq[i].score.rank;
    const count = i + 1;
    if (count >= minCount && rankSum / count <= maxAvg) return true;
  }
  return false;
}

function everCumulativeTopRateAtLeast(seq: { score: GameScore }[], minCount: number, minRate: number): boolean {
  let topCount = 0;
  for (let i = 0; i < seq.length; i++) {
    if (seq[i].score.rank === 1) topCount += 1;
    const count = i + 1;
    if (count >= minCount && topCount / count >= minRate) return true;
  }
  return false;
}

function everCumulativeLastRateAtMost(seq: { score: GameScore; game: Game }[], minCount: number, maxRate: number): boolean {
  let lastCount = 0;
  for (let i = 0; i < seq.length; i++) {
    if (isLastPlace(seq[i].score, seq[i].game)) lastCount += 1;
    const count = i + 1;
    if (count >= minCount && lastCount / count <= maxRate) return true;
  }
  return false;
}

function digitsOf(n: number): string {
  return String(Math.trunc(Math.abs(n)));
}

/** 例: 11100, 22200 のような「ゾロ目＋末尾ゼロ」パターン。 */
function isRepdigitWithTrailingZeros(n: number): boolean {
  if (n <= 0) return false;
  const trimmed = digitsOf(n).replace(/0+$/, '');
  if (trimmed.length < 2) return false;
  return [...trimmed].every((c) => c === trimmed[0]);
}

/** 例: 12300, 23400 のような「連番＋末尾ゼロ」パターン。 */
function isConsecutiveAscendingWithTrailingZeros(n: number): boolean {
  if (n <= 0) return false;
  const trimmed = digitsOf(n).replace(/0+$/, '');
  if (trimmed.length < 2) return false;
  for (let i = 1; i < trimmed.length; i++) {
    if (Number(trimmed[i]) !== Number(trimmed[i - 1]) + 1) return false;
  }
  return true;
}

/** 例: 4400, 44400 のように「0」と指定した1桁の数字だけで構成されているか。 */
function isComposedOfDigitAndZeros(n: number, digit: string): boolean {
  if (n <= 0) return false;
  const s = digitsOf(n);
  if (!s.includes(digit)) return false;
  return [...s].every((c) => c === '0' || c === digit);
}

function isCyclicRotationOf1234(window: number[]): boolean {
  if (window.length !== 4) return false;
  const base = [1, 2, 3, 4];
  for (let shift = 0; shift < 4; shift++) {
    const rotated = [0, 1, 2, 3].map((i) => base[(i + shift) % 4]);
    if (window.every((v, i) => v === rotated[i])) return true;
  }
  return false;
}

function canonicalScoreKey(scores: GameScore[]): string {
  return [...scores]
    .map((s) => s.rawScore)
    .sort((a, b) => a - b)
    .join(',');
}

interface DayInfo {
  day: DayRecord;
  monthKey: string;
  dateKey: string;
  hanchans: Game[];
  byPlayer: Record<string, { entries: { game: Game; idx: number; score: GameScore }[]; ptTotal: number }>;
  participantIds: string[];
  rankOf: Record<string, number>;
  tieCountOf: Record<string, number>;
}

interface HanchanCtx {
  di: DayInfo;
  game: Game;
  idx: number;
  score: GameScore;
  pt: number;
  isFirstOfDay: boolean;
  isLastOfDay: boolean;
}

interface DaySessionCtx {
  di: DayInfo;
  ptTotal: number;
  rank: number;
  tieCount: number;
  hanchanCount: number;
  participantCount: number;
}

function buildDayInfos(history: DayRecord[], settings: Settings): DayInfo[] {
  const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return sorted.map((day) => {
    const byPlayer: DayInfo['byPlayer'] = {};
    day.games.forEach((game, idx) => {
      game.scores.forEach((score) => {
        if (!byPlayer[score.playerId]) byPlayer[score.playerId] = { entries: [], ptTotal: 0 };
        byPlayer[score.playerId].entries.push({ game, idx, score });
        byPlayer[score.playerId].ptTotal += hanchanPt(score, settings);
      });
    });
    const participantIds = Object.keys(byPlayer);
    const rankOf: Record<string, number> = {};
    participantIds.forEach((pid) => {
      rankOf[pid] = 1 + participantIds.filter((o) => byPlayer[o].ptTotal > byPlayer[pid].ptTotal).length;
    });
    const tieCountOf: Record<string, number> = {};
    participantIds.forEach((pid) => {
      tieCountOf[pid] = participantIds.filter((o) => rankOf[o] === rankOf[pid]).length;
    });
    return {
      day,
      monthKey: day.date.slice(0, 7),
      dateKey: day.date.slice(0, 10),
      hanchans: day.games,
      byPlayer,
      participantIds,
      rankOf,
      tieCountOf,
    };
  });
}

function groupMonthly(
  daySeq: DaySessionCtx[],
  hanchanSeq: HanchanCtx[],
): Map<string, { days: DaySessionCtx[]; hanchans: HanchanCtx[] }> {
  const map = new Map<string, { days: DaySessionCtx[]; hanchans: HanchanCtx[] }>();
  daySeq.forEach((d) => {
    const mk = d.di.monthKey;
    if (!map.has(mk)) map.set(mk, { days: [], hanchans: [] });
    map.get(mk)!.days.push(d);
  });
  hanchanSeq.forEach((h) => {
    const mk = h.di.monthKey;
    if (!map.has(mk)) map.set(mk, { days: [], hanchans: [] });
    map.get(mk)!.hanchans.push(h);
  });
  return map;
}

function hasAnyMonth(
  daySeq: DaySessionCtx[],
  hanchanSeq: HanchanCtx[],
  pred: (days: DaySessionCtx[], hanchans: HanchanCtx[]) => boolean,
): boolean {
  for (const g of groupMonthly(daySeq, hanchanSeq).values()) {
    if (pred(g.days, g.hanchans)) return true;
  }
  return false;
}

function hasConsecutiveMonths(hanchanSeq: HanchanCtx[], n: number): boolean {
  const monthKeys = new Set(hanchanSeq.map((h) => h.di.monthKey));
  for (const mk of monthKeys) {
    const [y, m] = mk.split('-').map(Number);
    let ok = true;
    for (let i = 0; i < n; i++) {
      const total = y * 12 + (m - 1) + i;
      const yy = Math.floor(total / 12);
      const mm = (total % 12) + 1;
      if (!monthKeys.has(`${yy}-${String(mm).padStart(2, '0')}`)) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

/** Per-player set of unlocked trophy ids, derived entirely from recorded history. */
export function computePlayerTrophies(
  history: DayRecord[],
  players: Player[],
  settings: Settings,
): Record<string, Set<string>> {
  const dayInfos = buildDayInfos(history, settings);

  const scoreKeyToGameIds = new Map<string, Set<string>>();
  for (const di of dayInfos) {
    for (const game of di.hanchans) {
      const key = canonicalScoreKey(game.scores);
      if (!scoreKeyToGameIds.has(key)) scoreKeyToGameIds.set(key, new Set());
      scoreKeyToGameIds.get(key)!.add(game.id);
    }
  }
  const repeatedGameIds = new Set<string>();
  scoreKeyToGameIds.forEach((ids) => {
    if (ids.size >= 2) ids.forEach((id) => repeatedGameIds.add(id));
  });

  let firstYakumanPlayerId: string | null = null;
  outer: for (const di of dayInfos) {
    for (const game of di.hanchans) {
      for (const event of game.yakumanEvents ?? []) {
        firstYakumanPlayerId = event.playerId;
        break outer;
      }
    }
  }

  const result: Record<string, Set<string>> = {};
  players.forEach((p) => (result[p.id] = new Set()));

  for (const player of players) {
    const pid = player.id;
    const earned = result[pid];

    const hanchanSeq: HanchanCtx[] = [];
    for (const di of dayInfos) {
      const pdata = di.byPlayer[pid];
      if (!pdata) continue;
      for (const e of pdata.entries) {
        hanchanSeq.push({
          di,
          game: e.game,
          idx: e.idx,
          score: e.score,
          pt: hanchanPt(e.score, settings),
          isFirstOfDay: e.idx === 0,
          isLastOfDay: e.idx === di.hanchans.length - 1,
        });
      }
    }
    if (hanchanSeq.length === 0) continue;

    const daySeq: DaySessionCtx[] = dayInfos
      .filter((di) => di.byPlayer[pid])
      .map((di) => ({
        di,
        ptTotal: di.byPlayer[pid].ptTotal,
        rank: di.rankOf[pid],
        tieCount: di.tieCountOf[pid],
        hanchanCount: di.byPlayer[pid].entries.length,
        participantCount: di.participantIds.length,
      }));

    const has = (pred: (h: HanchanCtx) => boolean) => hanchanSeq.some(pred);
    const hasDay = (pred: (d: DaySessionCtx) => boolean) => daySeq.some(pred);
    const hanchanCount = hanchanSeq.length;
    const topCount = hanchanSeq.filter((h) => h.score.rank === 1).length;
    const tobiCount = hanchanSeq.filter((h) => h.score.rawScore < 0).length;

    // === BRONZE ===
    if (has((h) => h.score.rank === 1)) earned.add('b01');
    if (has((h) => h.score.rank <= 2)) earned.add('b02');
    if (has((h) => !isLastPlace(h.score, h.game))) earned.add('b03');
    if (has((h) => h.score.rawScore > settings.initialScore)) earned.add('b04');
    if (has((h) => h.score.rawScore >= 30000)) earned.add('b05');
    if (has((h) => h.score.rawScore >= 40000)) earned.add('b06');
    if (has((h) => h.score.rank === 2)) earned.add('b07');
    if (has((h) => h.score.rank === 3)) earned.add('b08');
    if (has((h) => h.isFirstOfDay && h.score.rank === 1)) earned.add('b09');
    if (has((h) => h.isLastOfDay && h.score.rank === 1)) earned.add('b10');
    if (hasDay((d) => d.ptTotal > 0)) earned.add('b11');
    for (let i = 0; i < hanchanSeq.length - 1; i++) {
      if (isLastPlace(hanchanSeq[i].score, hanchanSeq[i].game) && hanchanSeq[i + 1].score.rank === 1) earned.add('b12');
      if (hanchanSeq[i].score.rank === 1 && isLastPlace(hanchanSeq[i + 1].score, hanchanSeq[i + 1].game)) earned.add('b13');
    }
    if (hasConsecutive(hanchanSeq, 2, (h) => h.score.rank <= 2)) earned.add('b14');
    if (
      hasDay((d) => {
        const dayHanchans = hanchanSeq.filter((h) => h.di === d.di);
        const last = dayHanchans[dayHanchans.length - 1];
        return !!last && last.score.rank === 1 && d.rank === d.participantCount;
      })
    )
      earned.add('b15');
    if (
      has((h) => {
        const rank2 = h.game.scores.find((s) => s.rank === 2);
        return h.score.rank === 1 && rank2 !== undefined && h.score.rawScore - rank2.rawScore <= 3000;
      })
    )
      earned.add('b16');
    if (
      has((h) => {
        const rank2 = h.game.scores.find((s) => s.rank === 2);
        return h.score.rank === 1 && rank2 !== undefined && h.score.rawScore - rank2.rawScore >= 20000;
      })
    )
      earned.add('b17');
    {
      const dateCounts = new Map<string, number>();
      daySeq.forEach((d) => dateCounts.set(d.di.dateKey, (dateCounts.get(d.di.dateKey) ?? 0) + 1));
      if ([...dateCounts.values()].some((c) => c >= 2)) earned.add('b18');
    }
    if (has((h) => (h.game.yakumanEvents?.length ?? 0) > 0)) earned.add('b19');

    // === SILVER ===
    if (has((h) => h.score.rawScore >= 50000)) earned.add('s01');
    if (has((h) => h.score.rawScore >= 60000)) earned.add('s02');
    if (hasConsecutive(daySeq, 2, (d) => d.rank === 1)) earned.add('s03');
    if (hasConsecutive(daySeq, 3, (d) => d.rank <= 2)) earned.add('s04');
    if (hasConsecutive(daySeq, 4, (d) => d.rank !== d.participantCount)) earned.add('s05');
    if (has((h) => h.score.rank === 1 && h.game.scores.some((s) => s.playerId !== pid && s.rawScore < 0))) earned.add('s06');
    if (
      has((h) => {
        const rank2 = h.game.scores.find((s) => s.rank === 2);
        return h.score.rank === 1 && rank2 !== undefined && h.score.rawScore - rank2.rawScore >= 30000;
      })
    )
      earned.add('s07');
    if (
      has((h) => {
        const rank2 = h.game.scores.find((s) => s.rank === 2);
        return h.score.rank === 1 && rank2 !== undefined && h.score.rawScore - rank2.rawScore <= 1000;
      })
    )
      earned.add('s08');
    if (
      hasDay((d) => {
        const dayHanchans = hanchanSeq.filter((h) => h.di === d.di);
        const first = dayHanchans[0];
        return !!first && isLastPlace(first.score, first.game) && d.ptTotal > 0;
      })
    )
      earned.add('s09');
    if (
      hasDay((d) => {
        if (d.hanchanCount < 3) return false;
        const dayHanchans = hanchanSeq.filter((h) => h.di === d.di);
        const avgRank = dayHanchans.reduce((a, h) => a + h.score.rank, 0) / dayHanchans.length;
        return avgRank <= 2.0;
      })
    )
      earned.add('s10');
    if (
      hasDay((d) => d.hanchanCount >= 2 && hanchanSeq.filter((h) => h.di === d.di).every((h) => h.score.rank === 1))
    )
      earned.add('s11');
    if (has((h) => h.score.rank === 1 && h.score.rawScore < 35000)) earned.add('s12');
    if (has((h) => h.score.rawScore >= 0 && h.score.rawScore <= 1000)) earned.add('s13');
    if (
      hasDay((d) => {
        const ranks = new Set(hanchanSeq.filter((h) => h.di === d.di).map((h) => h.score.rank));
        return [1, 2, 3, 4].every((r) => ranks.has(r));
      })
    )
      earned.add('s14');
    if (hasAnyMonth(daySeq, hanchanSeq, (_days, hanchans) => hanchans.reduce((a, h) => a + h.pt, 0) > 0)) earned.add('s15');
    if (topCount >= 10) earned.add('s16');
    if (hanchanCount >= 30) earned.add('s17');
    if (has((h) => h.score.rawScore % 10000 === 0)) earned.add('s18');

    // === GOLD ===
    if (has((h) => h.score.rawScore >= 70000)) earned.add('g01');
    if (has((h) => h.score.rawScore >= 80000)) earned.add('g02');
    if (hasConsecutive(daySeq, 3, (d) => d.rank === 1)) earned.add('g03');
    if (hasConsecutive(daySeq, 5, (d) => d.rank <= 2)) earned.add('g04');
    if (hasConsecutive(daySeq, 10, (d) => d.rank !== d.participantCount)) earned.add('g05');
    {
      const dateGroups = new Map<string, DaySessionCtx[]>();
      daySeq.forEach((d) => {
        const k = d.di.dateKey;
        if (!dateGroups.has(k)) dateGroups.set(k, []);
        dateGroups.get(k)!.push(d);
      });
      if ([...dateGroups.values()].some((ds) => ds.length >= 4 && ds.every((d) => d.rank === 1))) earned.add('g06');
    }
    if (
      has((h) => {
        const rank2 = h.game.scores.find((s) => s.rank === 2);
        return h.score.rank === 1 && rank2 !== undefined && h.score.rawScore - rank2.rawScore >= 50000;
      })
    )
      earned.add('g07');
    if (has((h) => h.score.rank === 1 && h.game.scores.filter((s) => s.playerId !== pid).every((s) => s.rawScore < 0)))
      earned.add('g08');
    if (
      has(
        (h) =>
          h.score.rank === 1 &&
          h.game.scores.filter((s) => s.playerId !== pid).every((s) => s.rawScore < settings.initialScore),
      )
    )
      earned.add('g09');
    if (has((h) => h.score.rank === 1 && h.pt > 100)) earned.add('g10');
    if (hasAnyMonth(daySeq, hanchanSeq, (_days, hanchans) => hanchans.reduce((a, h) => a + h.pt, 0) >= 300)) earned.add('g11');
    if (
      hasAnyMonth(
        daySeq,
        hanchanSeq,
        (days, hanchans) => days.length >= 5 && hanchans.every((h) => !isLastPlace(h.score, h.game)),
      )
    )
      earned.add('g12');
    if (
      hasDay((d) => {
        const dh = hanchanSeq.filter((h) => h.di === d.di);
        return dh.length >= 2 && isLastPlace(dh[0].score, dh[0].game) && isLastPlace(dh[1].score, dh[1].game) && d.ptTotal > 0;
      })
    )
      earned.add('g13');
    if (everCumulativeAvgRankAtMost(hanchanSeq, 10, 1.5)) earned.add('g14');
    if (topCount >= 50) earned.add('g15');
    if (hanchanCount >= 100) earned.add('g16');
    if (everCumulativeAtLeast(hanchanSeq, 500)) earned.add('g17');
    if (everCumulativeAvgRankAtMost(hanchanSeq, 30, 2.0)) earned.add('g18');
    if (everCumulativeTopRateAtLeast(hanchanSeq, 20, 0.5)) earned.add('g19');

    // === PLATINUM ===
    if (hasConsecutive(daySeq, 4, (d) => d.rank === 1)) earned.add('p01');
    if (hasConsecutive(daySeq, 5, (d) => d.rank === 1)) earned.add('p02');
    if (hasConsecutive(daySeq, 10, (d) => d.rank <= 2)) earned.add('p03');
    if (hasConsecutive(daySeq, 20, (d) => d.rank !== d.participantCount)) earned.add('p04');
    if (has((h) => h.score.rawScore >= 100000)) earned.add('p05');
    if (
      has((h) => {
        const rank2 = h.game.scores.find((s) => s.rank === 2);
        return h.score.rank === 1 && rank2 !== undefined && h.score.rawScore - rank2.rawScore >= 60000;
      })
    )
      earned.add('p06');
    if (topCount >= 100) earned.add('p07');
    if (hanchanCount >= 300) earned.add('p08');
    if (everCumulativeTopRateAtLeast(hanchanSeq, 100, 0.4)) earned.add('p09');
    if (everCumulativeLastRateAtMost(hanchanSeq, 100, 0.1)) earned.add('p10');
    if (everCumulativeAtLeast(hanchanSeq, 1000)) earned.add('p11');
    if (
      hasDay((d) => {
        const dh = hanchanSeq.filter((h) => h.di === d.di);
        let running = 0;
        let dippedBelow = false;
        for (const h of dh) {
          running += h.pt;
          if (running < -150) dippedBelow = true;
        }
        return dippedBelow && d.ptTotal > 0;
      })
    )
      earned.add('p12');
    if (hasAnyMonth(daySeq, hanchanSeq, (days, hanchans) => days.length >= 10 && hanchans.every((h) => h.score.rank <= 2)))
      earned.add('p13');
    if (has((h) => h.score.rank === 2 && h.score.rawScore >= 50000)) earned.add('p14');
    if (has((h) => h.score.rank === 1 && h.score.rawScore < 31000)) earned.add('p15');
    if (hasDay((d) => d.rank === 1 && d.tieCount >= 2)) earned.add('p16');
    if (hasDay((d) => d.hanchanCount >= 3 && d.ptTotal === 0)) earned.add('p17');
    if (hasDay((d) => d.hanchanCount >= 10)) earned.add('p18');
    if (hasConsecutiveMonths(hanchanSeq, 12)) earned.add('p19');
    if (new Set(daySeq.map((d) => d.di.dateKey)).size >= 100) earned.add('p20');

    // === SPECIAL ===
    const myYakumanIds = new Set<string>();
    let hasCompoundEvent = false;
    let hasTripleOrMoreEvent = false;
    let hasKillerEvent = false;
    for (const h of hanchanSeq) {
      const myEvents = (h.game.yakumanEvents ?? []).filter((e) => e.playerId === pid);
      for (const event of myEvents) {
        event.yakumanIds.forEach((id) => myYakumanIds.add(id));
        if (event.yakumanIds.length >= 2) hasCompoundEvent = true;
        const weight = event.yakumanIds.reduce((sum, id) => sum + (findYakuman(id)?.isDouble ? 2 : 1), 0);
        if (weight >= 3) hasTripleOrMoreEvent = true;
      }
      if (myEvents.length > 0 && h.game.scores.some((s) => s.playerId !== pid && s.rawScore < 0)) hasKillerEvent = true;
    }
    if (myYakumanIds.has('kokushi')) earned.add('sp01');
    if (myYakumanIds.has('kokushi-13')) earned.add('sp02');
    if (myYakumanIds.has('suuankou')) earned.add('sp03');
    if (myYakumanIds.has('suuankou-tanki')) earned.add('sp04');
    if (myYakumanIds.has('daisangen')) earned.add('sp05');
    if (myYakumanIds.has('ryuuiisou')) earned.add('sp06');
    if (myYakumanIds.has('chuuren')) earned.add('sp07');
    if (myYakumanIds.has('junsei-chuuren')) earned.add('sp08');
    if (myYakumanIds.has('chinroutou')) earned.add('sp09');
    if (myYakumanIds.has('tsuiisou')) earned.add('sp10');
    if (myYakumanIds.has('shousuushii')) earned.add('sp11');
    if (myYakumanIds.has('daisuushii')) earned.add('sp12');
    if (myYakumanIds.has('suukantsu')) earned.add('sp13');
    if (myYakumanIds.has('tenho')) earned.add('sp14');
    if (myYakumanIds.has('chiho')) earned.add('sp15');
    if (myYakumanIds.has('renhou')) earned.add('sp16');
    if (myYakumanIds.has('kazoe')) earned.add('sp17');
    if (hasCompoundEvent) earned.add('sp18');
    if (hasTripleOrMoreEvent) earned.add('sp19');
    if (firstYakumanPlayerId === pid) earned.add('sp20');
    if (hasKillerEvent) earned.add('sp21');

    // === UNDERGROUND ===
    if (tobiCount >= 1) earned.add('u01');
    if (tobiCount >= 2) earned.add('u02');
    if (tobiCount >= 3) earned.add('u03');
    if (tobiCount >= 5) earned.add('u04');
    if (tobiCount >= 10) earned.add('u05');
    if (has((h) => h.score.rawScore >= -5000 && h.score.rawScore < 0)) earned.add('u06');
    if (has((h) => h.score.rawScore >= -10000 && h.score.rawScore < -5000)) earned.add('u07');
    if (has((h) => h.score.rawScore >= -15000 && h.score.rawScore < -10000)) earned.add('u08');
    if (has((h) => h.score.rawScore >= -20000 && h.score.rawScore < -15000)) earned.add('u09');
    if (has((h) => h.score.rawScore < -20000)) earned.add('u10');

    // === IMPOSSIBLE ===
    if (has((h) => h.game.scores.every((s) => s.rawScore === settings.initialScore))) earned.add('i01');
    if (
      has((h) => {
        if (h.game.scores.length !== 4) return false;
        const sorted = [...h.game.scores].sort((a, b) => b.rawScore - a.rawScore).map((s) => s.rawScore);
        return sorted[0] === 40000 && sorted[1] === 30000 && sorted[2] === 20000 && sorted[3] === 10000;
      })
    )
      earned.add('i02');
    if (has((h) => h.game.scores.some((s) => s.rawScore === 0))) earned.add('i03');
    if (
      has((h) => {
        if (h.game.scores.length !== 4) return false;
        const groups = new Map<number, number>();
        h.game.scores.forEach((s) => groups.set(s.rawScore, (groups.get(s.rawScore) ?? 0) + 1));
        const sizes = [...groups.values()].sort((a, b) => b - a);
        return groups.size === 2 && sizes[0] === 2 && sizes[1] === 2;
      })
    )
      earned.add('i04');
    if (
      has((h) => {
        if (h.game.scores.length !== 4) return false;
        const r1 = h.game.scores.find((s) => s.rank === 1)!.rawScore;
        const r2 = h.game.scores.find((s) => s.rank === 2)!.rawScore;
        const r3 = h.game.scores.find((s) => s.rank === 3)!.rawScore;
        const r4 = h.game.scores.find((s) => s.rank === 4)!.rawScore;
        const initial = settings.initialScore;
        return r1 - initial === initial - r4 && r2 - initial === initial - r3;
      })
    )
      earned.add('i05');
    if (
      has((h) => {
        if (h.game.scores.length !== 4 || h.score.rank !== 1) return false;
        const others = h.game.scores.filter((s) => s.rank !== 1);
        return h.score.rawScore > 100000 && others.every((s) => s.rawScore <= 0);
      })
    )
      earned.add('i06');
    if (has((h) => h.score.rawScore === settings.initialScore)) earned.add('i07');
    if (has((h) => h.game.scores.every((s) => s.rawScore % 10000 === 0))) earned.add('i08');
    if (has((h) => isRepdigitWithTrailingZeros(h.score.rawScore))) earned.add('i09');
    if (has((h) => isConsecutiveAscendingWithTrailingZeros(h.score.rawScore))) earned.add('i10');
    for (let i = 0; i < hanchanSeq.length - 1; i++) {
      const a = hanchanSeq[i];
      const b = hanchanSeq[i + 1];
      if (a.di === b.di && a.score.rawScore === b.score.rawScore && a.score.rank === b.score.rank) earned.add('i11');
    }
    if (
      has((h) => {
        if (h.game.scores.length !== 4) return false;
        const r1 = h.game.scores.find((s) => s.rank === 1)!.rawScore;
        const r2 = h.game.scores.find((s) => s.rank === 2)!.rawScore;
        const r3 = h.game.scores.find((s) => s.rank === 3)!.rawScore;
        const r4 = h.game.scores.find((s) => s.rank === 4)!.rawScore;
        const g1 = r1 - r2;
        const g2 = r2 - r3;
        const g3 = r3 - r4;
        return g1 > 0 && g1 === g2 && g2 === g3;
      })
    )
      earned.add('i12');
    if (
      has((h) => {
        if (h.game.scores.length !== 4) return false;
        const max = Math.max(...h.game.scores.map((s) => s.rawScore));
        const tiedCount = h.game.scores.filter((s) => s.rawScore === max).length;
        return tiedCount === 3 && h.score.rawScore === max;
      })
    )
      earned.add('i13');
    if (has((h) => isComposedOfDigitAndZeros(h.score.rawScore, '4'))) earned.add('i14');
    if (has((h) => isComposedOfDigitAndZeros(h.score.rawScore, '7'))) earned.add('i15');
    for (let i = 0; i + 3 < hanchanSeq.length; i++) {
      const window = hanchanSeq.slice(i, i + 4);
      if (window.every((h) => h.di === window[0].di && h.game.scores.length === 4)) {
        if (isCyclicRotationOf1234(window.map((h) => h.score.rank))) earned.add('i16');
      }
    }
    if (
      has((h) => {
        if (h.game.scores.length !== 4) return false;
        const r1 = h.game.scores.find((s) => s.rank === 1)!.rawScore;
        const r2 = h.game.scores.find((s) => s.rank === 2)!.rawScore;
        const r3 = h.game.scores.find((s) => s.rank === 3)!.rawScore;
        const r4 = h.game.scores.find((s) => s.rank === 4)!.rawScore;
        return r1 - r2 <= 1000 && r2 - r3 <= 1000 && r3 - r4 <= 1000;
      })
    )
      earned.add('i17');
    if (has((h) => h.game.scores.every((s) => Math.abs(s.rawScore - settings.initialScore) <= 1000))) earned.add('i18');
    if (has((h) => h.game.scores.some((s) => s.rawScore < -30000))) earned.add('i19');
    if (has((h) => repeatedGameIds.has(h.game.id))) earned.add('i20');
  }

  return result;
}

export const TROPHY_LIST: TrophyDef[] = [
  // === Bronze ===
  { id: 'b01', tier: 'bronze', name: 'まずは初トップ', description: '今シーズン、初めて1着で対局を終える' },
  { id: 'b02', tier: 'bronze', name: '連対達成', description: '1着または2着で対局を終える' },
  { id: 'b03', tier: 'bronze', name: 'ラス回避', description: '4着を回避して対局を終える' },
  { id: 'b04', tier: 'bronze', name: 'プラス収支', description: '持ち点が原点（30,000点など）を1点でも上回って終了する' },
  { id: 'b05', tier: 'bronze', name: '30,000点の壁', description: '終局時の持ち点が30,000点以上になる' },
  { id: 'b06', tier: 'bronze', name: '40,000点の壁', description: '終局時の持ち点が40,000点以上になる' },
  { id: 'b07', tier: 'bronze', name: '安定の2着', description: '2着で対局を終える' },
  { id: 'b08', tier: 'bronze', name: '粘りの3着', description: '3着で対局を終える' },
  { id: 'b09', tier: 'bronze', name: 'ロケットスタート', description: 'その日の最初の対局で1着を獲得する' },
  { id: 'b10', tier: 'bronze', name: '有終の美', description: 'その日の最後の対局で1着を獲得する' },
  { id: 'b11', tier: 'bronze', name: 'トータルプラス', description: '合計ポイントがプラスで試合を終える' },
  { id: 'b12', tier: 'bronze', name: 'リベンジ', description: '4着を取った対局の直後の対局で1着を取る' },
  { id: 'b13', tier: 'bronze', name: '都落ち', description: '1着を取った対局の直後の対局で4着になる' },
  { id: 'b14', tier: 'bronze', name: 'コンスタント', description: '2局連続で連対する' },
  {
    id: 'b15',
    tier: 'bronze',
    name: '終わり良ければすべて良し',
    description: '最後の対局を1着で終えたうえで、その日の試合を4着で終える',
  },
  { id: 'b16', tier: 'bronze', name: '僅差の競り勝ち', description: '2着との差が3,000点以内という接戦で1着になる' },
  { id: 'b17', tier: 'bronze', name: '圧倒的勝者', description: '2着と20,000点以上の大差をつけて1着になる' },
  { id: 'b18', tier: 'bronze', name: 'ダブルヘッダー', description: '1日に2回以上、異なる試合に参加する' },
  {
    id: 'b19',
    tier: 'bronze',
    name: '役満の目撃者',
    description: '同じ卓の誰かが役満をアガった対局に参加している（自分がアガっていなくてもOK）',
  },

  // === Silver ===
  { id: 's01', tier: 'silver', name: '運か実力か', description: '終局時の持ち点が50,000点以上になる' },
  { id: 's02', tier: 'silver', name: '誰にも止められない', description: '終局時の持ち点が60,000点以上になる' },
  { id: 's03', tier: 'silver', name: '連勝街道', description: '2試合連続で1着を獲得する' },
  { id: 's04', tier: 'silver', name: '安定の極み', description: '3試合連続で連対する' },
  { id: 's05', tier: 'silver', name: '鉄壁の守り', description: '4試合連続でラスを回避する' },
  { id: 's06', tier: 'silver', name: '踏み台', description: '誰かがハコ下（マイナス点）で終了した対局で1着になる' },
  { id: 's07', tier: 'silver', name: '独壇場', description: '2着と30,000点以上の大差をつけて圧勝する' },
  { id: 's08', tier: 'silver', name: '大接戦の勝者', description: '2着との差が1,000点以内という超僅差で1着になる' },
  {
    id: 's09',
    tier: 'silver',
    name: '怒涛の巻き返し',
    description: 'その日の最初の対局で4着だったが、合計ポイントをプラスにして試合を終える',
  },
  { id: 's10', tier: 'silver', name: '絶好調な一日', description: '1日に3半荘以上プレイし、平均順位が2.0以下で試合を終える' },
  { id: 's11', tier: 'silver', name: 'パーフェクト・デイ', description: '1日に2半荘以上プレイし、全半荘で1着になる' },
  { id: 's12', tier: 'silver', name: '泥沼を制す', description: '1着の持ち点が35,000点未満という、全員の点数が拮抗した対局で1着になる' },
  { id: 's13', tier: 'silver', name: '地底まであと10歩', description: '終局時の持ち点が0点〜1,000点の状態で対局を終える' },
  { id: 's14', tier: 'silver', name: '喜怒哀楽', description: '1日のうちに1着、2着、3着、4着をすべて経験する' },
  { id: 's15', tier: 'silver', name: '黒字経営', description: '1ヶ月間の合計ポイントがプラスで終わる' },
  { id: 's16', tier: 'silver', name: '通算10勝', description: 'シーズン中、10半荘で1着を獲得する' },
  { id: 's17', tier: 'silver', name: '歴戦の雀士', description: '30半荘に参加する' },
  {
    id: 's18',
    tier: 'silver',
    name: '計算しやすそー',
    description: '終局時の持ち点が「40,000点」や「50,000点」など、10,000点単位でキリの良い数字になる',
  },

  // === Gold ===
  { id: 'g01', tier: 'gold', name: '70,000点の頂き', description: '終局時の持ち点が70,000点以上になる' },
  { id: 'g02', tier: 'gold', name: '80,000点の絶景', description: '終局時の持ち点が80,000点以上になる' },
  { id: 'g03', tier: 'gold', name: 'ハットトリック', description: '3試合連続で1着を獲得する' },
  { id: 'g04', tier: 'gold', name: '無敗の進撃', description: '5試合連続で2着以内（連対）に入る' },
  { id: 'g05', tier: 'gold', name: '鉄壁', description: '10試合連続で4着（ラス）を回避する' },
  { id: 'g06', tier: 'gold', name: '完全試合', description: '1日に4試合以上プレイし、全試合で1着を獲得する' },
  { id: 'g07', tier: 'gold', name: 'トリプルスコア', description: '2着に50,000点以上の絶望的な大差をつけて1着になる' },
  { id: 'g08', tier: 'gold', name: 'どういうこと？', description: '終局時、自分以外の3人全員がハコ下の状態で1着になる' },
  {
    id: 'g09',
    tier: 'gold',
    name: 'アガりすぎ',
    description: '終局時、自分以外の3人全員の持ち点が原点（例：30,000点）を下回った状態で1着になる',
  },
  { id: 'g10', tier: 'gold', name: '大台突破', description: '1回の対局で獲得したポイントが「+100.0」を超える大トップを取る' },
  {
    id: 'g11',
    tier: 'gold',
    name: '月間MVP級',
    description: '1ヶ月間の合計スコア（ポイント）が、＋300.0などの圧倒的なプラスを記録して月を終える',
  },
  { id: 'g12', tier: 'gold', name: '無傷の月間', description: '1ヶ月間に5試合以上プレイし、一度も4着を取らずにその月を終える' },
  {
    id: 'g13',
    tier: 'gold',
    name: '帳消し麻雀',
    description: '同じ日の最初の2試合で連続4着だったが、最終的にその日の合計スコアをプラスにまで巻き返して終える',
  },
  { id: 'g14', tier: 'gold', name: 'エースの証明', description: '平均順位が1.5以下で試合を終える' },
  { id: 'g15', tier: 'gold', name: '通算50勝', description: '累計50半荘で1着を獲得する' },
  { id: 'g16', tier: 'gold', name: 'センチュリー・クラブ', description: '累計100半荘の対局結果を記録する' },
  { id: 'g17', tier: 'gold', name: 'ハーフ・ミリオネア', description: '累計獲得ポイントが＋500.0の大台を突破する' },
  { id: 'g18', tier: 'gold', name: 'トップランカー', description: '累計30試合以上プレイした時点で、通算の平均順位が2.00以下をキープしている' },
  { id: 'g19', tier: 'gold', name: '勝率5割の壁', description: '累計20試合以上プレイした時点で、通算の1着獲得率（トップ率）が50%以上ある' },

  // === Platinum ===
  { id: 'p01', tier: 'platinum', name: '四神降臨', description: '4試合連続で1着を獲得する' },
  { id: 'p02', tier: 'platinum', name: '五帝の覇気', description: '5試合連続で1着を獲得する' },
  { id: 'p03', tier: 'platinum', name: '神域の連対', description: '10試合連続で2着以内（連対）に入る' },
  { id: 'p04', tier: 'platinum', name: '金剛不壊', description: '20試合連続で4着（ラス）を回避する' },
  { id: 'p05', tier: 'platinum', name: 'やりすぎだよ～', description: '終局時の持ち点が100,000点以上になる（10万点オーバー）' },
  { id: 'p06', tier: 'platinum', name: '異次元の大勝', description: '2着に60,000点以上の絶望的な大差をつけて1着になる' },
  { id: 'p07', tier: 'platinum', name: '絶対王者の証明', description: '累計で100回、1着を獲得する' },
  { id: 'p08', tier: 'platinum', name: '麻雀の申し子', description: '累計300半荘の対局結果を記録する' },
  { id: 'p09', tier: 'platinum', name: 'グランドマスター', description: '累計100試合以上プレイした時点で、通算の1着獲得率（トップ率）が40%以上ある' },
  { id: 'p10', tier: 'platinum', name: '鉄壁の防空壕', description: '累計100半荘以上プレイした時点で、通算のラス率が10%以下をキープしている' },
  { id: 'p11', tier: 'platinum', name: '雲の上の存在', description: '累計の合計獲得スコア（ポイント）が＋1,000.0を突破する' },
  {
    id: 'p12',
    tier: 'platinum',
    name: '絶望からの生還',
    description: 'その日の途中で合計スコアが「-150.0」を下回った状態から、最終的にその日の合計ポイントをプラスにまで巻き返して終える',
  },
  { id: 'p13', tier: 'platinum', name: '天下無双の月間', description: '1ヶ月間に10試合以上プレイし、一度も3着・4着を取らずにその月を終える' },
  { id: 'p14', tier: 'platinum', name: '不運なる猛者', description: '終局時の持ち点が50,000点以上あったにもかかわらず、トップを逃して2着になる' },
  { id: 'p15', tier: 'platinum', name: '氷のテーブル', description: '1着の持ち点が31,000点未満という、極限のロースコア戦で1着になる' },
  { id: 'p16', tier: 'platinum', name: '奇跡の一騎打ち', description: '同点1着で試合を終える' },
  {
    id: 'p17',
    tier: 'platinum',
    name: 'スコア・マエストロ',
    description: '1日の合計ポイントが、プラスマイナス「0.0」ぴったりで終わる（最低3半荘以上プレイ）',
  },
  { id: 'p18', tier: 'platinum', name: '限界突破の十番勝負', description: '1日のうちに10半荘以上の対局結果を記録する' },
  { id: 'p19', tier: 'platinum', name: '四季を巡る雀士', description: '12ヶ月連続で、毎月1回以上対局データを登録する' },
  { id: 'p20', tier: 'platinum', name: '江戸川の伝説', description: '対局データの登録日数が、累計で100日を突破する。' },

  // === Special ===
  { id: 'sp01', tier: 'special', name: '終焉を刻む十三針', description: '国士無双を成就させる' },
  { id: 'sp02', tier: 'special', name: '宿命を穿つ十三の星', description: '国士無双十三面待ちを成就させる（上位形）' },
  { id: 'sp03', tier: 'special', name: '静寂を切り裂く咆哮', description: '四暗刻を成就させる' },
  { id: 'sp04', tier: 'special', name: '孤高なる王の玉座', description: '四暗刻単騎を成就させる（上位形）' },
  { id: 'sp05', tier: 'special', name: '神域の三連祭壇', description: '大三元を成就させる' },
  { id: 'sp06', tier: 'special', name: '翡翠の絶対領域', description: '緑一色を成就させる' },
  { id: 'sp07', tier: 'special', name: '至高へ至る九つの門', description: '九蓮宝燈を成就させる' },
  { id: 'sp08', tier: 'special', name: '真理に到達せし九つの光', description: '純正九蓮宝燈（九面待ち）を成就させる（上位形）' },
  { id: 'sp09', tier: 'special', name: '歴史を刻む古の賢者', description: '清老頭を成就させる' },
  { id: 'sp10', tier: 'special', name: '深淵からの呼び声', description: '字一色を成就させる' },
  { id: 'sp11', tier: 'special', name: '四方を駆け抜ける烈風', description: '小四喜を成就させる' },
  { id: 'sp12', tier: 'special', name: '天地創造の四神', description: '大四喜を成就させる（上位形）' },
  { id: 'sp13', tier: 'special', name: '因果を捻じ曲げる四つの奇跡', description: '四槓子を成就させる' },
  { id: 'sp14', tier: 'special', name: '神に許されし第一手', description: '天和を成就させる' },
  { id: 'sp15', tier: 'special', name: '大地に眠る奇跡', description: '地和を成就させる' },
  { id: 'sp16', tier: 'special', name: '宵闇の凶弾', description: '人和を成就させる（※ローカル役満を採用している場合）' },
  { id: 'sp17', tier: 'special', name: '天を衝く無限の連鎖', description: '数え役満（13翻以上）を成就させる' },
  {
    id: 'sp18',
    tier: 'special',
    name: '二重奏の神話',
    description: '複合役満（大三元＋字一色など、異なる役満の複合）を成就させる',
  },
  { id: 'sp19', tier: 'special', name: '宇宙（コスモ）の崩壊', description: 'トリプル役満以上を成就させる' },
  { id: 'sp20', tier: 'special', name: '伝説の幕開け', description: 'アプリ全体で「最初の役満」を記録する' },
  { id: 'sp21', tier: 'special', name: '魂を刈る死神', description: '役満をアガり、同時に相手をハコ下（トビ）にして対局を終了させる' },

  // === UnderGround ===
  { id: 'u01', tier: 'underground', name: '地底人との出会い', description: 'シーズン中、初めてトビを記録する' },
  { id: 'u02', tier: 'underground', name: '地底人との再会', description: 'シーズン中、2回目のトビを記録する' },
  { id: 'u03', tier: 'underground', name: '地底人との友情', description: 'シーズン中、3回目のトビを記録する' },
  { id: 'u04', tier: 'underground', name: '地底人との絆', description: 'シーズン中、5回目のトビを記録する' },
  { id: 'u05', tier: 'underground', name: '地底人との結婚', description: 'シーズン中、10回目のトビを記録する' },
  { id: 'u06', tier: 'underground', name: '地底探索ツアー', description: '素点が-5,000点以上、0点未満で対局を終える' },
  { id: 'u07', tier: 'underground', name: '声も聞こえない', description: '-10,000点以上、-5,000点未満で対局を終える' },
  { id: 'u08', tier: 'underground', name: '電波ですら怪しい', description: '-15,000点以上、-10,000点未満で対局を終える' },
  { id: 'u09', tier: 'underground', name: '地底移住権獲得', description: '-20,000点以上、-15,000点未満で対局を終える' },
  { id: 'u10', tier: 'underground', name: '地底国籍取得', description: '-20,000点未満で対局を終える' },

  // === Impossible ===
  { id: 'i01', tier: 'impossible', name: '完全なる平和', description: '全員の持ち点が「25,000点」ちょうどで終了する' },
  {
    id: 'i02',
    tier: 'impossible',
    name: '等差の奇跡',
    description: '4人の持ち点が上から順に「40,000点、30,000点、20,000点、10,000点」で終了する',
  },
  { id: 'i03', tier: 'impossible', name: '絶対零度', description: '誰か一人の持ち点が、ハコ下ではなく「ピッタリ0点」で終了する' },
  {
    id: 'i04',
    tier: 'impossible',
    name: '双子の卓',
    description: '1位と2位、および3位と4位の持ち点が、それぞれ全く同じ点数（同着）で終了する',
  },
  {
    id: 'i05',
    tier: 'impossible',
    name: '鏡合わせのスコア',
    description: '1位のプラス分と4位のマイナス分、2位のプラス分と3位のマイナス分が完全に一致する（例：5万、4万、2万、1万）',
  },
  {
    id: 'i06',
    tier: 'impossible',
    name: '十万点の孤独',
    description: '1位の持ち点が100,000点を超え、残り3人が全員0点以下（ハコ下・または0点）で終了する',
  },
  {
    id: 'i07',
    tier: 'impossible',
    name: '原点回帰の呪縛',
    description: '終局時の持ち点が、開始時の原点（30,000点など）と100点単位まで狂わずピッタリ同じになる',
  },
  {
    id: 'i08',
    tier: 'impossible',
    name: '神々の遊び',
    description: '4人全員の持ち点が「10,000点単位」のキリの良い数字になる（例：50,000、30,000、20,000、0）',
  },
  {
    id: 'i09',
    tier: 'impossible',
    name: 'エンジェルナンバー',
    description: '自分の終了時の持ち点が「11,100点」「22,200点」「33,300点」などのゾロ目になる',
  },
  {
    id: 'i10',
    tier: 'impossible',
    name: '一気通貫スコア',
    description: '自分の終了時の持ち点が「12,300点」「23,400点」など、数字が連番になる',
  },
  {
    id: 'i11',
    tier: 'impossible',
    name: 'デジャヴ',
    description: '同じ日の対局で、2試合連続で「全く同じ持ち点・全く同じ順位」で終了する',
  },
  {
    id: 'i12',
    tier: 'impossible',
    name: '奇跡の階段',
    description: '1位と2位の点差、2位と3位の点差、3位と4位の点差が「すべて完全に同じ点数」になる',
  },
  { id: 'i13', tier: 'impossible', name: '究極のトップタイ', description: '4人中3人が同点トップ（1位タイ）で終了する' },
  {
    id: 'i14',
    tier: 'impossible',
    name: '死線の淵（しせんのふち）',
    description: '終了時の自分の持ち点が「4,400点」や「44,400点」など、4だけで構成される',
  },
  {
    id: 'i15',
    tier: 'impossible',
    name: 'ラッキーセブン',
    description: '終了時の自分の持ち点が「7,700点」や「77,700点」など、7だけで構成される',
  },
  {
    id: 'i16',
    tier: 'impossible',
    name: '輪廻転生',
    description: '同じ日の対局で、4試合連続で「1着、2着、3着、4着」を順番に取る（どの順から始まっても可）',
  },
  {
    id: 'i17',
    tier: 'impossible',
    name: '100点の極限',
    description: '1位から4位までの全員の点差が、それぞれ1,000点以内に収まった超密着状態で終了する',
  },
  { id: 'i18', tier: 'impossible', name: '無の境地', description: '全員の持ち点が、原点からプラスマイナス1,000点以内の超僅差で終了する' },
  { id: 'i19', tier: 'impossible', name: 'ブラックホール', description: '誰か1人の持ち点が「マイナス30,000点」を下回る記録的な大敗北を喫する' },
  {
    id: 'i20',
    tier: 'impossible',
    name: '歴史の反復',
    description: 'アプリの過去の対局履歴のどれかと、4人の持ち点が「100点単位まで完全に一致」する試合が発生する',
  },
];
