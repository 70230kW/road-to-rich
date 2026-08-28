import type { DayRecord, Player, Settings } from '../types';

export interface RankTier {
  name: string;
  minPt: number;
}

/**
 * 天鳳・雀魂風の段位ラダー。しきい値は素点ベースの「pt」
 * （trophies.ts と同様、レート設定に依存しないよう rawScore と配給原点の差分/1000）の累計。
 * 段位はトロフィーと違って永久固定ではなく、現在の累計ptだけを見て毎回再計算する
 * （昇段も降段もあり得る）。
 */
export const RANK_TIERS: RankTier[] = [
  { name: '雀士1', minPt: 0 },
  { name: '雀士2', minPt: 20 },
  { name: '雀士3', minPt: 40 },
  { name: '雀傑1', minPt: 60 },
  { name: '雀傑2', minPt: 90 },
  { name: '雀傑3', minPt: 120 },
  { name: '雀豪1', minPt: 160 },
  { name: '雀豪2', minPt: 200 },
  { name: '雀豪3', minPt: 250 },
  { name: '雀聖1', minPt: 320 },
  { name: '雀聖2', minPt: 400 },
  { name: '雀聖3', minPt: 500 },
  { name: '魂天', minPt: 650 },
];

export interface PlayerRankStatus {
  playerId: string;
  cumulativePt: number;
  levelIndex: number;
  levelName: string;
  nextLevelName: string | null;
  /** 次の段位まで必要なpt。最高段位なら null。 */
  ptToNextLevel: number | null;
  /** 現在の段位内での進捗（0〜1）。最高段位なら 1。 */
  progressRatio: number;
}

function hanchanPt(rawScore: number, initialScore: number): number {
  return (rawScore - initialScore) / 1000;
}

export function computePlayerRankStatuses(
  history: DayRecord[],
  players: Player[],
  settings: Settings,
): Record<string, PlayerRankStatus> {
  const cumulative = new Map<string, number>();
  players.forEach((p) => cumulative.set(p.id, 0));

  for (const day of history) {
    for (const game of day.games) {
      for (const score of game.scores) {
        if (!cumulative.has(score.playerId)) continue;
        cumulative.set(score.playerId, (cumulative.get(score.playerId) ?? 0) + hanchanPt(score.rawScore, settings.initialScore));
      }
    }
  }

  const result: Record<string, PlayerRankStatus> = {};
  players.forEach((p) => {
    const pt = cumulative.get(p.id) ?? 0;
    let levelIndex = 0;
    for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
      if (pt >= RANK_TIERS[i].minPt) {
        levelIndex = i;
        break;
      }
    }
    const current = RANK_TIERS[levelIndex];
    const next = RANK_TIERS[levelIndex + 1] ?? null;
    const progressRatio = next ? Math.max(0, Math.min(1, (pt - current.minPt) / (next.minPt - current.minPt))) : 1;

    result[p.id] = {
      playerId: p.id,
      cumulativePt: pt,
      levelIndex,
      levelName: current.name,
      nextLevelName: next ? next.name : null,
      ptToNextLevel: next ? Math.max(0, next.minPt - pt) : null,
      progressRatio,
    };
  });
  return result;
}
