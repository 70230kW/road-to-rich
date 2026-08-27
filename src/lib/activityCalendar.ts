import type { DayRecord } from '../types';

export interface ActivityCalendarData {
  /** history に含まれる年（新しい順）。 */
  years: number[];
  /** 日付キー（YYYY-MM-DD）ごとの半荘数。同じ日に複数回精算した場合は合算する。 */
  activityByDate: Map<string, number>;
  /** 年ごとの「対局を記録した日数」（ダブルヘッダーでも1日としてカウント）。 */
  daysPlayedByYear: Map<number, number>;
  /** 日付キーごとの DayRecord 一覧（ダブルヘッダーの場合は複数件）。 */
  daysByDate: Map<string, DayRecord[]>;
}

/** 対局カレンダー（活動ヒートマップ）を描画するための集計データを作る。 */
export function computeActivityCalendarData(history: DayRecord[]): ActivityCalendarData {
  const activityByDate = new Map<string, number>();
  const datesByYear = new Map<number, Set<string>>();
  const daysByDate = new Map<string, DayRecord[]>();

  for (const day of history) {
    const dateKey = day.date.slice(0, 10);
    const year = new Date(day.date).getUTCFullYear();
    activityByDate.set(dateKey, (activityByDate.get(dateKey) ?? 0) + day.games.length);
    if (!datesByYear.has(year)) datesByYear.set(year, new Set());
    datesByYear.get(year)!.add(dateKey);
    if (!daysByDate.has(dateKey)) daysByDate.set(dateKey, []);
    daysByDate.get(dateKey)!.push(day);
  }

  const years = Array.from(datesByYear.keys()).sort((a, b) => b - a);
  const daysPlayedByYear = new Map<number, number>();
  datesByYear.forEach((dates, year) => daysPlayedByYear.set(year, dates.size));

  return { years, activityByDate, daysPlayedByYear, daysByDate };
}
