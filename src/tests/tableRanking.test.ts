import { describe, expect, it } from 'vitest';
import { computeTableRanking } from '../lib/tableRanking';
import type { DayRecord, Player } from '../types';

const players: Player[] = [
  { id: 'a', name: 'Alice', color: '#111111' },
  { id: 'b', name: 'Bob', color: '#222222' },
  { id: 'c', name: 'Carolina', color: '#333333' },
  { id: 'd', name: 'Daisuke', color: '#444444' },
];

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
        // a and b play again; c sits this one out entirely.
        scores: [
          { playerId: 'a', rawScore: 20000, rank: 3, point: -1500 },
          { playerId: 'b', rawScore: 40000, rank: 1, point: 4500 },
          { playerId: 'd', rawScore: 30000, rank: 2, point: 1500 },
        ],
      },
    ],
    settlement: {},
  },
];

describe('computeTableRanking', () => {
  it('ranks other players by how many hanchans they shared with the target, most first', () => {
    const result = computeTableRanking(history, players, 'a');
    expect(result.map((r) => r.playerId)).toEqual(['b', 'd', 'c']);
    expect(result.find((r) => r.playerId === 'b')!.gamesTogether).toBe(2);
    expect(result.find((r) => r.playerId === 'd')!.gamesTogether).toBe(2);
    expect(result.find((r) => r.playerId === 'c')!.gamesTogether).toBe(1);
  });

  it('computes the profit differential (target point - opponent point) over shared hanchans only', () => {
    const result = computeTableRanking(history, players, 'a');
    // vs b: g1: 4500 - (-1500) = 6000. g2: -1500 - 4500 = -6000. Total 0.
    expect(result.find((r) => r.playerId === 'b')!.profitAgainst).toBe(0);
    // vs c: g1 only: 4500 - 1500 = 3000.
    expect(result.find((r) => r.playerId === 'c')!.profitAgainst).toBe(3000);
    // vs d: g1: 4500 - (-4500) = 9000. g2: -1500 - 1500 = -3000. Total 6000.
    expect(result.find((r) => r.playerId === 'd')!.profitAgainst).toBe(6000);
  });

  it('includes players who never shared a table, with zero games and zero profit', () => {
    const result = computeTableRanking([], players, 'a');
    expect(result).toHaveLength(3);
    expect(result.every((r) => r.gamesTogether === 0 && r.profitAgainst === 0)).toBe(true);
  });

  it('excludes the target player themself from the ranking', () => {
    const result = computeTableRanking(history, players, 'a');
    expect(result.some((r) => r.playerId === 'a')).toBe(false);
  });
});
