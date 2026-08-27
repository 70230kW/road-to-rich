import { describe, expect, it } from 'vitest';
import { computeHeadToHead } from '../lib/rivalry';
import type { DayRecord } from '../types';

const history: DayRecord[] = [
  {
    id: 'day1',
    date: '2026-01-01T00:00:00.000Z',
    tableFee: 0,
    chips: {},
    chipRate: 100,
    games: [
      {
        id: 'g1',
        scores: [
          { playerId: 'a', rawScore: 40000, rank: 1, point: 4500 },
          { playerId: 'b', rawScore: 20000, rank: 3, point: -1500 },
          { playerId: 'c', rawScore: 30000, rank: 2, point: 1500 },
          { playerId: 'd', rawScore: 10000, rank: 4, point: -4500 },
        ],
      },
      {
        id: 'g2',
        // b beats a this time; c does not play, so this hanchan isn't "shared" for a-vs-c.
        scores: [
          { playerId: 'b', rawScore: 40000, rank: 1, point: 4500 },
          { playerId: 'a', rawScore: 20000, rank: 3, point: -1500 },
          { playerId: 'd', rawScore: 30000, rank: 2, point: 1500 },
          { playerId: 'e', rawScore: 10000, rank: 4, point: -4500 },
        ],
      },
    ],
    settlement: {},
  },
];

describe('computeHeadToHead', () => {
  it('counts shared hanchans, wins by rank, and the point differential', () => {
    const stats = computeHeadToHead(history, 'a', 'b');
    // g1: a rank1 beats b rank3. g2: b rank1 beats a rank3.
    expect(stats.sharedHanchanCount).toBe(2);
    expect(stats.aWins).toBe(1);
    expect(stats.bWins).toBe(1);
    // g1: 4500 - (-1500) = 6000. g2: -1500 - 4500 = -6000. Total 0.
    expect(stats.totalPointDiff).toBe(0);
  });

  it('only counts hanchans where both players actually participated', () => {
    const stats = computeHeadToHead(history, 'a', 'c');
    expect(stats.sharedHanchanCount).toBe(1);
    expect(stats.aWins).toBe(1);
    expect(stats.bWins).toBe(0);
  });

  it('returns all-zero stats for a pair that never shared a table', () => {
    const stats = computeHeadToHead(history, 'c', 'e');
    expect(stats).toEqual({ sharedHanchanCount: 0, aWins: 0, bWins: 0, totalPointDiff: 0 });
  });
});
