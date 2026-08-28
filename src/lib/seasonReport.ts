import type { DayRecord, Player, Settings } from '../types';
import { computeRanking } from './stats';
import { computeHallOfFame, type HallOfFame } from './hallOfFame';
import { computePlayerTrophies } from './trophies';

export interface VoteLeader {
  playerId: string;
  playerName: string;
  count: number;
}

export interface SeasonReportData {
  hanchanCount: number;
  dayCount: number;
  champion: { playerId: string; playerName: string; profit: number } | null;
  hallOfFame: HallOfFame;
  trophyCounts: Record<string, number>;
  topVotedMvp: VoteLeader | null;
  topVotedHanzai: VoteLeader | null;
}

function topVoted(tally: Map<string, number>, players: Player[]): VoteLeader | null {
  let best: VoteLeader | null = null;
  for (const [playerId, count] of tally) {
    if (count > 0 && (best === null || count > best.count)) {
      const playerName = players.find((p) => p.id === playerId)?.name ?? '不明';
      best = { playerId, playerName, count };
    }
  }
  return best;
}

/** シーズン（または通算）の総括レポートを、既存の集計関数を組み合わせて構築する。 */
export function computeSeasonReport(history: DayRecord[], players: Player[], settings: Settings): SeasonReportData {
  const ranking = computeRanking(history, players);
  const active = ranking.filter((r) => r.hanchanCount > 0);
  const champion = active[0]
    ? { playerId: active[0].playerId, playerName: active[0].name, profit: active[0].totalProfitWithoutFee }
    : null;

  const hanchanCount = history.reduce((sum, day) => sum + day.games.length, 0);
  const dayCount = history.length;

  const hallOfFame = computeHallOfFame(history, players);

  const trophiesByPlayer = computePlayerTrophies(history, players, settings);
  const trophyCounts: Record<string, number> = {};
  players.forEach((p) => {
    trophyCounts[p.id] = trophiesByPlayer[p.id]?.size ?? 0;
  });

  const mvpTally = new Map<string, number>();
  const hanzaiTally = new Map<string, number>();
  for (const day of history) {
    if (!day.votes) continue;
    for (const [pid, count] of Object.entries(day.votes.mvp ?? {})) {
      mvpTally.set(pid, (mvpTally.get(pid) ?? 0) + count);
    }
    for (const [pid, count] of Object.entries(day.votes.hanzai ?? {})) {
      hanzaiTally.set(pid, (hanzaiTally.get(pid) ?? 0) + count);
    }
  }

  return {
    hanchanCount,
    dayCount,
    champion,
    hallOfFame,
    trophyCounts,
    topVotedMvp: topVoted(mvpTally, players),
    topVotedHanzai: topVoted(hanzaiTally, players),
  };
}
