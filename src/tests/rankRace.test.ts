import { describe, expect, it } from 'vitest';
import { computeRankRaceSeries } from '../lib/rankRace';
import type { DayRecord, Player } from '../types';

const players: Player[] = [
  { id: 'a', name: 'Alice', color: '#111111' },
  { id: 'b', name: 'Bob', color: '#222222' },
];

function settlementDay(id: string, date: string, profits: Record<string, number>): DayRecord {
  return {
    id,
    date,
    games: [],
    tableFee: 0,
    chips: {},
    chipRate: 100,
    settlement: Object.fromEntries(
      Object.entries(profits).map(([playerId, profit]) => [
        playerId,
        { gamesTotal: profit, chipCount: 0, chipValue: 0, tableFeeShare: 0, totalWithoutFee: profit, totalWithFee: profit },
      ]),
    ),
  };
}

describe('computeRankRaceSeries', () => {
  it('starts everyone tied at the START point', () => {
    const history = [settlementDay('d1', '2026-01-01T00:00:00.000Z', { a: 1000, b: -1000 })];
    const result = computeRankRaceSeries(history, players);
    expect(result.points[0].label).toBe('START');
    expect(result.points[0].ranks).toEqual({ a: 1, b: 2 });
  });

  it('re-ranks players as cumulative profit changes over time', () => {
    const history = [
      settlementDay('d1', '2026-01-01T00:00:00.000Z', { a: -1000, b: 1000 }),
      settlementDay('d2', '2026-01-02T00:00:00.000Z', { a: 5000, b: 0 }),
    ];
    const result = computeRankRaceSeries(history, players);
    // after day 1: a=-1000, b=1000 -> b is rank 1
    expect(result.points[1].ranks).toEqual({ a: 2, b: 1 });
    // after day 2: a=4000, b=1000 -> a is rank 1
    expect(result.points[2].ranks).toEqual({ a: 1, b: 2 });
  });

  it('returns an empty points/players set for empty history', () => {
    const result = computeRankRaceSeries([], players);
    expect(result.activePlayers).toEqual([]);
    expect(result.points).toEqual([{ label: 'START', dayId: null, ranks: {} }]);
  });
});
