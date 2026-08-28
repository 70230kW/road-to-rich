import { describe, expect, it } from 'vitest';
import { computeRarePairs } from '../lib/matchmaking';
import type { DayRecord, Player } from '../types';

const players: Player[] = [
  { id: 'a', name: 'Alice', color: '#111111' },
  { id: 'b', name: 'Bob', color: '#222222' },
  { id: 'c', name: 'Carolina', color: '#333333' },
];

function day(id: string, dateIso: string, playerIds: string[]): DayRecord {
  return {
    id,
    date: dateIso,
    games: [{ id: `${id}-g1`, scores: playerIds.map((playerId, i) => ({ playerId, rawScore: 0, rank: i + 1, point: 0 })) }],
    tableFee: 0,
    chips: {},
    chipRate: 100,
    settlement: {},
  };
}

describe('computeRarePairs', () => {
  it('surfaces a never-played pair first', () => {
    // a+b play together twice; a+c and b+c never share a table.
    const history = [day('d1', '2026-01-01T00:00:00.000Z', ['a', 'b']), day('d2', '2026-01-02T00:00:00.000Z', ['a', 'b'])];
    const result = computeRarePairs(history, players);
    expect(result[0].sharedHanchanCount).toBe(0);
    expect(result[0].lastPlayedDate).toBeNull();
    expect([result[0].playerAId, result[0].playerBId].sort()).not.toEqual(['a', 'b']);
  });

  it('sorts by fewest shared hanchans, then by oldest last-played date', () => {
    const history = [
      day('d1', '2026-01-01T00:00:00.000Z', ['a', 'b']),
      day('d2', '2026-01-10T00:00:00.000Z', ['a', 'c']),
      day('d3', '2026-01-20T00:00:00.000Z', ['a', 'b']),
    ];
    const result = computeRarePairs(history, players, 3);
    // b+c: 0 shared games -> first. a+c: 1 shared game, last played 01-10. a+b: 2 shared games, last played 01-20.
    expect(result.map((r) => r.sharedHanchanCount)).toEqual([0, 1, 2]);
  });

  it('respects the limit parameter', () => {
    const result = computeRarePairs([], players, 1);
    expect(result).toHaveLength(1);
  });

  it('counts a shared hanchan only when both players actually appear in the same game', () => {
    const history = [day('d1', '2026-01-01T00:00:00.000Z', ['a', 'c'])]; // b sat this one out
    const result = computeRarePairs(history, players);
    const ab = result.find((r) => [r.playerAId, r.playerBId].sort().join() === 'a,b');
    expect(ab?.sharedHanchanCount).toBe(0);
  });
});
