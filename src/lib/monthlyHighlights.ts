import type { DayRecord, Player } from '../types';
import { computeRanking } from './stats';

interface HighlightEntry {
  playerId: string;
  name: string;
  value: number;
}

export interface MonthlyHighlights {
  year: number;
  /** 1〜12 */
  month: number;
  hasData: boolean;
  /** 今月の収支トップ（場代抜き）。 */
  mvp: HighlightEntry | null;
  /** 今月の収支ワースト（場代抜き）。 */
  worst: HighlightEntry | null;
  /** 今月のトビ回数が最多の雀士。 */
  mostTobi: HighlightEntry | null;
}

/** history を referenceDate と同じ年月の日だけに絞り込む。 */
export function filterToMonth(history: DayRecord[], referenceDate: Date): DayRecord[] {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  return history.filter((day) => {
    const d = new Date(day.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

/** 当月（referenceDate 基準）のMVP・ワースト・トビ王を算出する。history はシーズンフィルタ適用前の全履歴を渡すこと。 */
export function computeMonthlyHighlights(
  history: DayRecord[],
  players: Player[],
  referenceDate: Date = new Date(),
): MonthlyHighlights {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth() + 1;
  const monthHistory = filterToMonth(history, referenceDate);

  if (monthHistory.length === 0) {
    return { year, month, hasData: false, mvp: null, worst: null, mostTobi: null };
  }

  const rankingRows = computeRanking(monthHistory, players).filter((r) => r.hanchanCount > 0);

  const mvpRow = rankingRows.reduce<(typeof rankingRows)[number] | null>(
    (best, r) => (best === null || r.totalProfitWithoutFee > best.totalProfitWithoutFee ? r : best),
    null,
  );
  const worstRow = rankingRows.reduce<(typeof rankingRows)[number] | null>(
    (worst, r) => (worst === null || r.totalProfitWithoutFee < worst.totalProfitWithoutFee ? r : worst),
    null,
  );

  const tobiCounts = new Map<string, number>();
  players.forEach((p) => tobiCounts.set(p.id, 0));
  for (const day of monthHistory) {
    for (const game of day.games) {
      for (const score of game.scores) {
        if (score.rawScore < 0) tobiCounts.set(score.playerId, (tobiCounts.get(score.playerId) ?? 0) + 1);
      }
    }
  }
  let mostTobi: HighlightEntry | null = null;
  tobiCounts.forEach((count, playerId) => {
    if (count > 0 && (mostTobi === null || count > mostTobi.value)) {
      const name = players.find((p) => p.id === playerId)?.name ?? '不明';
      mostTobi = { playerId, name, value: count };
    }
  });

  return {
    year,
    month,
    hasData: true,
    mvp: mvpRow ? { playerId: mvpRow.playerId, name: mvpRow.name, value: mvpRow.totalProfitWithoutFee } : null,
    worst: worstRow ? { playerId: worstRow.playerId, name: worstRow.name, value: worstRow.totalProfitWithoutFee } : null,
    mostTobi,
  };
}
