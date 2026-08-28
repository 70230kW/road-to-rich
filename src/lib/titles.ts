import type { DayRecord, Player } from '../types';
import { computePlayerRateStats, computeRanking } from './stats';

export interface PlayerTitle {
  playerId: string;
  title: string;
  description: string;
}

/** レート系（トップ率・トビ率・平均着順）の称号を検討するための最低半荘数。少ない対局数での偶然を避ける。 */
const MIN_HANCHAN_FOR_RATE_TITLES = 3;

/**
 * トロフィー（一度獲得したら永久）とは異なり、現在の成績のみを見て毎回計算し直す
 * 「今の状態」を表す称号。1人につき最大1つ、優先度の高い条件から順に判定する。
 */
export function computePlayerTitles(history: DayRecord[], players: Player[]): Record<string, PlayerTitle | null> {
  const result: Record<string, PlayerTitle | null> = {};
  players.forEach((p) => (result[p.id] = null));

  const ranking = computeRanking(history, players);
  const active = ranking.filter((r) => r.hanchanCount > 0);
  if (active.length === 0) return result;

  const leader = active[0];
  result[leader.playerId] = { playerId: leader.playerId, title: '覇王', description: '総合収支1位' };

  if (active.length > 1) {
    const last = active[active.length - 1];
    if (last.playerId !== leader.playerId) {
      result[last.playerId] = { playerId: last.playerId, title: '修行中', description: '総合収支最下位' };
    }
  }

  const rateStats = computePlayerRateStats(history, players);
  const eligible = active.filter((r) => r.hanchanCount >= MIN_HANCHAN_FOR_RATE_TITLES);

  const bestBy = (getValue: (row: (typeof eligible)[number]) => number | null, higherIsBetter: boolean) => {
    let bestPlayerId: string | null = null;
    let bestValue: number | null = null;
    for (const r of eligible) {
      if (result[r.playerId] !== null) continue;
      const value = getValue(r);
      if (value === null) continue;
      if (bestValue === null || (higherIsBetter ? value > bestValue : value < bestValue)) {
        bestValue = value;
        bestPlayerId = r.playerId;
      }
    }
    return bestPlayerId;
  };

  const topRateWinner = bestBy((r) => rateStats[r.playerId]?.topRate ?? null, true);
  if (topRateWinner) {
    result[topRateWinner] = { playerId: topRateWinner, title: '常勝の雀士', description: 'トップ率1位' };
  }

  const tobiWinner = bestBy((r) => {
    const rate = rateStats[r.playerId]?.tobiRate ?? null;
    return rate !== null && rate > 0 ? rate : null;
  }, true);
  if (tobiWinner) {
    result[tobiWinner] = { playerId: tobiWinner, title: 'トビ魔王', description: 'トビ率1位' };
  }

  const avgRankWinner = bestBy((r) => r.avgRank, false);
  if (avgRankWinner) {
    result[avgRankWinner] = { playerId: avgRankWinner, title: '堅実の達人', description: '平均着順1位' };
  }

  return result;
}
