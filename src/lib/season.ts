import type { DayRecord } from '../types';

/** 'all' = 通算（全期間）。number は西暦年で、その年のみに絞り込む。 */
export type SeasonFilter = 'all' | number;

/** history に含まれる年を新しい順で返す（シーズン選択の選択肢を作るのに使う）。 */
export function getAvailableSeasons(history: DayRecord[]): number[] {
  const years = new Set<number>();
  history.forEach((day) => years.add(new Date(day.date).getFullYear()));
  return Array.from(years).sort((a, b) => b - a);
}

/** 指定したシーズンの記録だけに絞り込む。'all' の場合は全件をそのまま返す。 */
export function filterHistoryBySeason(history: DayRecord[], season: SeasonFilter): DayRecord[] {
  if (season === 'all') return history;
  return history.filter((day) => new Date(day.date).getFullYear() === season);
}
