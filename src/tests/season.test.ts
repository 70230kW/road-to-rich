import { describe, expect, it } from 'vitest';
import { filterHistoryBySeason, getAvailableSeasons } from '../lib/season';
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

  it('filters down to only the days in the given year', () => {
    const result = filterHistoryBySeason(history, 2026);
    expect(result.map((d) => d.id)).toEqual(['d1', 'd2']);
  });

  it('returns an empty array for a year with no data', () => {
    expect(filterHistoryBySeason(history, 2025)).toEqual([]);
  });
});
