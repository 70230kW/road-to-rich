import type { DayRecord } from '../types';

/**
 * 'all' = 通算（全期間）。
 * { year, month: 'all' } = その年の通期。
 * { year, month: 1〜12 } = その年のその月だけ。
 */
export type SeasonFilter = 'all' | { year: number; month: number | 'all' };

/** history に含まれる年を新しい順で返す（シーズン選択の選択肢を作るのに使う）。 */
export function getAvailableSeasons(history: DayRecord[]): number[] {
  const years = new Set<number>();
  history.forEach((day) => years.add(new Date(day.date).getFullYear()));
  return Array.from(years).sort((a, b) => b - a);
}

/** 指定したシーズンの記録だけに絞り込む。'all' の場合は全件をそのまま返す。 */
export function filterHistoryBySeason(history: DayRecord[], season: SeasonFilter): DayRecord[] {
  if (season === 'all') return history;
  return history.filter((day) => {
    const date = new Date(day.date);
    if (date.getFullYear() !== season.year) return false;
    if (season.month === 'all') return true;
    return date.getMonth() + 1 === season.month;
  });
}

/** シーズン選択の表示ラベル（例: 「通算」「2026年」「2026年5月」）。 */
export function formatSeasonLabel(season: SeasonFilter): string {
  if (season === 'all') return '通算';
  if (season.month === 'all') return `${season.year}年`;
  return `${season.year}年${season.month}月`;
}
