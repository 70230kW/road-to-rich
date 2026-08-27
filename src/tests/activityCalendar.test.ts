import { describe, expect, it } from 'vitest';
import { computeActivityCalendarData } from '../lib/activityCalendar';
import type { DayRecord } from '../types';

function day(id: string, date: string, hanchanCount: number): DayRecord {
  return {
    id,
    date,
    games: Array.from({ length: hanchanCount }, (_, i) => ({ id: `${id}-g${i}`, scores: [] })),
    tableFee: 0,
    chips: {},
    chipRate: 100,
    settlement: {},
  };
}

describe('computeActivityCalendarData', () => {
  it('returns distinct years present, newest first', () => {
    const history = [day('d1', '2026-01-05T00:00:00.000Z', 2), day('d2', '2027-03-01T00:00:00.000Z', 1)];
    expect(computeActivityCalendarData(history).years).toEqual([2027, 2026]);
  });

  it('sums hanchan counts per date, combining double-header days into one entry', () => {
    const history = [day('d1', '2026-01-05T00:00:00.000Z', 2), day('d2', '2026-01-05T08:00:00.000Z', 3)];
    const { activityByDate, daysPlayedByYear } = computeActivityCalendarData(history);
    expect(activityByDate.get('2026-01-05')).toBe(5);
    expect(daysPlayedByYear.get(2026)).toBe(1);
  });

  it('counts distinct calendar dates per year for daysPlayedByYear', () => {
    const history = [day('d1', '2026-01-05T00:00:00.000Z', 1), day('d2', '2026-01-06T00:00:00.000Z', 1)];
    expect(computeActivityCalendarData(history).daysPlayedByYear.get(2026)).toBe(2);
  });

  it('returns empty results for empty history', () => {
    const result = computeActivityCalendarData([]);
    expect(result.years).toEqual([]);
    expect(result.activityByDate.size).toBe(0);
    expect(result.daysPlayedByYear.size).toBe(0);
    expect(result.daysByDate.size).toBe(0);
  });

  it('groups DayRecords by date key, preserving double-header entries separately', () => {
    const d1 = day('d1', '2026-01-05T00:00:00.000Z', 2);
    const d2 = day('d2', '2026-01-05T08:00:00.000Z', 3);
    const { daysByDate } = computeActivityCalendarData([d1, d2]);
    expect(daysByDate.get('2026-01-05')).toEqual([d1, d2]);
  });
});
