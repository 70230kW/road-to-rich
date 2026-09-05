import { describe, expect, it } from 'vitest';
import { filterHistoryBySeason, formatSeasonLabel, getAvailableSeasons } from '../lib/season';
import type { DayRecord } from '../types';

function day(id: string, date: string): DayRecord {
  return { id, date, games: [], tableFee: 0, chips: {}, chipRate: 100, settlement: {} };
}

const history: DayRecord[] = [
  day('d1', '2026-01-05T00:00:00.000Z'),
  day('d2', '2026-06-15T00:00:00.000Z'),
  day('d3', '2027-02-01T00:00:00.000Z'),
];

describe('getAvailableSeasons', () => {
  it('returns distinct years present in history, newest first', () => {
    expect(getAvailableSeasons(history)).toEqual([2027, 2026]);
  });

  it('returns an empty array for empty history', () => {
    expect(getAvailableSeasons([])).toEqual([]);
  });
});

describe('filterHistoryBySeason', () => {
  it("returns everything unchanged for 'all'", () => {
    expect(filterHistoryBySeason(history, 'all')).toEqual(history);
  });

  it('filters down to only the days in the given year when month is "all"', () => {
    const result = filterHistoryBySeason(history, { year: 2026, month: 'all' });
    expect(result.map((d) => d.id)).toEqual(['d1', 'd2']);
  });

  it('filters down to only the days in the given year AND month', () => {
    const result = filterHistoryBySeason(history, { year: 2026, month: 1 });
    expect(result.map((d) => d.id)).toEqual(['d1']);
  });

  it('returns an empty array for a year with no data', () => {
    expect(filterHistoryBySeason(history, { year: 2025, month: 'all' })).toEqual([]);
  });

  it('returns an empty array for a year/month combination with no data', () => {
    expect(filterHistoryBySeason(history, { year: 2026, month: 12 })).toEqual([]);
  });
});

describe('formatSeasonLabel', () => {
  it("labels 'all' as 通算", () => {
    expect(formatSeasonLabel('all')).toBe('通算');
  });

  it('labels a whole year as ◯◯年', () => {
    expect(formatSeasonLabel({ year: 2026, month: 'all' })).toBe('2026年');
  });

  it('labels a specific month as ◯◯年◯月', () => {
    expect(formatSeasonLabel({ year: 2026, month: 5 })).toBe('2026年5月');
  });
});
