import { describe, expect, it } from 'vitest';
import { computeGroupHeadToHead } from '../lib/rivalry';
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
        // b beats a this time; c does not play, so this hanchan isn't "shared" for groups including c.
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

describe('computeGroupHeadToHead', () => {
  it('counts shared hanchans and each player wins/points for a 2-player group', () => {
    const result = computeGroupHeadToHead(history, ['a', 'b']);
    expect(result.sharedHanchanCount).toBe(2);
    expect(result.players.map((p) => p.playerId)).toEqual(['a', 'b']);
    expect(result.players[0].wins).toBe(1); // a won g1
    expect(result.players[1].wins).toBe(1); // b won g2
    expect(result.players[0].totalPoints).toBe(3000); // 4500 + -1500
    expect(result.players[1].totalPoints).toBe(3000); // -1500 + 4500
  });

  it('only counts hanchans where every selected player participated', () => {
    const result = computeGroupHeadToHead(history, ['a', 'c']);
    expect(result.sharedHanchanCount).toBe(1); // only g1; c sat out g2
  });

  it('supports 3-player groups, picking the best rank within just the selected group', () => {
    const result = computeGroupHeadToHead(history, ['a', 'b', 'd']);
    // g1: a=1, b=3, d=4 among these three -> a has the best rank -> a wins
    // g2: a=3, b=1, d=2 among these three -> b has the best rank -> b wins
    expect(result.sharedHanchanCount).toBe(2);
    const byId = Object.fromEntries(result.players.map((p) => [p.playerId, p]));
    expect(byId.a.wins).toBe(1);
    expect(byId.b.wins).toBe(1);
    expect(byId.d.wins).toBe(0);
  });

  it('supports 4-player groups', () => {
    const result = computeGroupHeadToHead(history, ['a', 'b', 'c', 'd']);
    // only g1 has all four players (g2 has e instead of c)
    expect(result.sharedHanchanCount).toBe(1);
    const byId = Object.fromEntries(result.players.map((p) => [p.playerId, p]));
    expect(byId.a.wins).toBe(1);
    expect(byId.b.wins).toBe(0);
    expect(byId.c.wins).toBe(0);
    expect(byId.d.wins).toBe(0);
  });

  it('returns all-zero stats for a group that never fully shared a table', () => {
    const result = computeGroupHeadToHead(history, ['c', 'e']);
    expect(result.sharedHanchanCount).toBe(0);
    expect(result.players.every((p) => p.wins === 0 && p.totalPoints === 0)).toBe(true);
  });
});
