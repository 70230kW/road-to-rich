import { describe, expect, it } from 'vitest';
import { computeSeasonReport } from '../lib/seasonReport';
import { defaultSettings } from '../lib/defaults';
import type { DayRecord, Player } from '../types';

const players: Player[] = [
  { id: 'a', name: 'Alice', color: '#111111' },
  { id: 'b', name: 'Bob', color: '#222222' },
];

function hanchan(id: string, playerId: string, rank: number, rawScore: number) {
  return { id, scores: [{ playerId, rawScore, rank, point: 0 }] };
}

function day(
  id: string,
  profits: Record<string, number>,
  games: DayRecord['games'] = [],
  votes?: DayRecord['votes'],
): DayRecord {
  return {
    id,
    date: '2026-01-01T00:00:00.000Z',
    games,
    tableFee: 0,
    chips: {},
    chipRate: 100,
    settlement: Object.fromEntries(
      Object.entries(profits).map(([playerId, profit]) => [
        playerId,
        { gamesTotal: profit, chipCount: 0, chipValue: 0, tableFeeShare: 0, totalWithoutFee: profit, totalWithFee: profit },
      ]),
    ),
    votes,
  };
}

describe('computeSeasonReport', () => {
  it('returns zeroed-out data for empty history', () => {
    const result = computeSeasonReport([], players, defaultSettings);
    expect(result.hanchanCount).toBe(0);
    expect(result.dayCount).toBe(0);
    expect(result.champion).toBeNull();
    expect(result.topVotedMvp).toBeNull();
    expect(result.topVotedHanzai).toBeNull();
  });

  it('counts total hanchans and days, and picks the profit leader as champion', () => {
    const games1 = [hanchan('g1', 'a', 1, 40000), hanchan('g2', 'b', 2, 10000)];
    const games2 = [hanchan('g3', 'a', 1, 40000)];
    const history = [day('d1', { a: 5000, b: -2000 }, games1), day('d2', { a: 3000 }, games2)];
    const result = computeSeasonReport(history, players, defaultSettings);
    expect(result.hanchanCount).toBe(3);
    expect(result.dayCount).toBe(2);
    expect(result.champion).toMatchObject({ playerId: 'a', profit: 8000 });
  });

  it('tallies MVP and 戦犯 votes across all days, picking the overall top vote-getter', () => {
    const history = [
      day('d1', { a: 1000 }, [], { mvp: { a: 2, b: 1 }, hanzai: { b: 1 } }),
      day('d2', { a: 1000 }, [], { mvp: { b: 2 }, hanzai: { b: 2 } }),
    ];
    const result = computeSeasonReport(history, players, defaultSettings);
    // mvp: a=2, b=1+2=3 -> b wins
    expect(result.topVotedMvp).toMatchObject({ playerId: 'b', playerName: 'Bob', count: 3 });
    // hanzai: b=1+2=3
    expect(result.topVotedHanzai).toMatchObject({ playerId: 'b', playerName: 'Bob', count: 3 });
  });

  it('returns null vote leaders when no day has recorded votes', () => {
    const history = [day('d1', { a: 1000 })];
    const result = computeSeasonReport(history, players, defaultSettings);
    expect(result.topVotedMvp).toBeNull();
    expect(result.topVotedHanzai).toBeNull();
  });
});
