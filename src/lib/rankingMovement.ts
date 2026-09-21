import type { DayRecord, Player } from '../types';
import { computeRanking, type RankingRow } from './stats';
import { filterHistoryBySeason, type SeasonFilter } from './season';
/** Competition ranks: equal profits share a rank; the following rank is skipped. */
export function rankPositions(rows: RankingRow[]): Record<string, number> {
  let position = 0;
  return Object.fromEntries(rows.map((r, i) => {
    if (i === 0 || r.totalProfitWithoutFee !== rows[i-1].totalProfitWithoutFee) position = i + 1;
    return [r.playerId, position];
  }));
}
export function gapToHigher(rows: RankingRow[], playerId: string): number | null {
  const row = rows.find(r => r.playerId === playerId);
  if (!row) return null;
  const higher = rows.filter(r => r.totalProfitWithoutFee > row.totalProfitWithoutFee).at(-1);
  return higher ? higher.totalProfitWithoutFee - row.totalProfitWithoutFee : null;
}

/** Difference from the adjacent rank: the leader compares with second place, everyone else with the row directly above. */
export function adjacentProfitGap(rows: RankingRow[], index: number): { amount: number; referencePlayerId: string } | null {
  if (rows.length < 2 || index < 0 || index >= rows.length) return null;
  const referenceIndex = index === 0 ? 1 : index - 1;
  return {
    amount: rows[index].totalProfitWithoutFee - rows[referenceIndex].totalProfitWithoutFee,
    referencePlayerId: rows[referenceIndex].playerId,
  };
}
export function rankingComparison(history: DayRecord[], players: Player[], season: SeasonFilter, now = new Date()) {
  let previous: DayRecord[];
  let label: string;
  if (season === 'all') {
    const cutoff = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    previous = history.filter(d => Date.parse(d.date) < cutoff);
    label = '前月末の通算順位比';
  } else if (season.month === 'all') {
    previous = filterHistoryBySeason(history, { year: season.year - 1, month: 'all' });
    label = `${season.year - 1}年の順位比`;
  } else {
    const date = new Date(season.year, season.month - 2, 1);
    previous = filterHistoryBySeason(history, { year: date.getFullYear(), month: date.getMonth() + 1 });
    label = `${date.getFullYear()}年${date.getMonth() + 1}月の順位比`;
  }
  return { positions: rankPositions(computeRanking(previous, players)), label };
}
