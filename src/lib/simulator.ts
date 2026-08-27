import type { DayRecord, Player } from '../types';
import { computeRanking } from './stats';

export interface SimulatorRow {
  playerId: string;
  name: string;
  currentProfit: number;
  hanchanCount: number;
  /** 1半荘あたりの平均収支（場代抜き）。半荘実績がなければ null。 */
  avgProfitPerHanchan: number | null;
  /** futureHanchans 半荘後の予測収支。現在の平均ペースが続くと仮定する単純な線形予測。 */
  projectedProfit: number | null;
}

/** 現在の平均ペースが続くと仮定し、futureHanchans 半荘後の収支を単純予測する。 */
export function computeSimulatorRows(history: DayRecord[], players: Player[], futureHanchans: number): SimulatorRow[] {
  const rankingRows = computeRanking(history, players);
  const n = Math.max(0, futureHanchans);

  return rankingRows
    .map((r) => {
      const avg = r.hanchanCount > 0 ? r.totalProfitWithoutFee / r.hanchanCount : null;
      return {
        playerId: r.playerId,
        name: r.name,
        currentProfit: r.totalProfitWithoutFee,
        hanchanCount: r.hanchanCount,
        avgProfitPerHanchan: avg,
        projectedProfit: avg !== null ? r.totalProfitWithoutFee + avg * n : null,
      };
    })
    .sort((a, b) => (b.projectedProfit ?? b.currentProfit) - (a.projectedProfit ?? a.currentProfit));
}

export interface CatchUpRow {
  playerId: string;
  name: string;
  /**
   * 現在の平均ペースを維持した場合にトップ（現在の首位）に追いつくまでの半荘数。
   * 既に首位と同着なら 0。現在のペースでは平均収支が首位以下で追いつけない場合は null。
   */
  hanchansNeeded: number | null;
}

/** 現在の首位（1位）に、他の各雀士が現在の平均ペースで追いつくまでの半荘数を試算する。 */
export function computeCatchUpToLeader(history: DayRecord[], players: Player[]): CatchUpRow[] {
  const rankingRows = computeRanking(history, players);
  if (rankingRows.length < 2) return [];

  const leader = rankingRows[0];
  if (leader.hanchanCount === 0) return [];
  const leaderAvg = leader.totalProfitWithoutFee / leader.hanchanCount;

  const result: CatchUpRow[] = [];
  for (const row of rankingRows.slice(1)) {
    if (row.hanchanCount === 0) continue;
    const avg = row.totalProfitWithoutFee / row.hanchanCount;
    if (avg > leaderAvg) {
      const hanchansNeeded = Math.ceil((leader.totalProfitWithoutFee - row.totalProfitWithoutFee) / (avg - leaderAvg));
      result.push({ playerId: row.playerId, name: row.name, hanchansNeeded: Math.max(0, hanchansNeeded) });
    } else {
      result.push({ playerId: row.playerId, name: row.name, hanchansNeeded: null });
    }
  }
  return result;
}
