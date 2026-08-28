import { describe, expect, it } from 'vitest';
import { computePlayerTitles } from '../lib/titles';
import type { DayRecord, Player } from '../types';

const players: Player[] = [
  { id: 'a', name: 'Alice', color: '#111111' },
  { id: 'b', name: 'Bob', color: '#222222' },
  { id: 'c', name: 'Carolina', color: '#333333' },
];

function hanchan(id: string, playerId: string, rank: number, rawScore: number) {
  return { id, scores: [{ playerId, rawScore, rank, point: 0 }] };
}

function day(id: string, profits: Record<string, number>, games: DayRecord['games']): DayRecord {
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
  };
}

describe('computePlayerTitles', () => {
  it('returns all-null titles when nobody has played', () => {
    expect(computePlayerTitles([], players)).toEqual({ a: null, b: null, c: null });
  });

  it('gives the profit leader 覇王 and the last-place player 修行中', () => {
    const games = [hanchan('g1', 'a', 1, 40000), hanchan('g2', 'b', 2, 20000), hanchan('g3', 'c', 3, 5000)];
    const history = [day('d1', { a: 5000, b: -2000, c: -3000 }, games)];
    const result = computePlayerTitles(history, players);
    expect(result.a).toMatchObject({ title: '覇王' });
    expect(result.c).toMatchObject({ title: '修行中' });
  });

  it('does not give a last-place title when there is only one active player', () => {
    const games = [hanchan('g1', 'a', 1, 40000)];
    const history = [day('d1', { a: 5000 }, games)];
    const result = computePlayerTitles(history, players);
    expect(result.a).toMatchObject({ title: '覇王' });
    expect(result.b).toBeNull();
    expect(result.c).toBeNull();
  });

  it('gives トップ率1位 to the best top-rate player among those not already titled', () => {
    // Alice: profit leader (覇王). Carolina: worst profit (修行中).
    // Bob: middling profit, but 3/3 wins -> free to receive トップ率1位.
    const games = [
      hanchan('g1', 'b', 1, 40000),
      hanchan('g2', 'b', 1, 40000),
      hanchan('g3', 'b', 1, 40000),
      hanchan('g4', 'a', 2, 25000),
      hanchan('g5', 'c', 4, 5000),
    ];
    const history = [day('d1', { a: 5000, b: 1000, c: -3000 }, games)];
    const result = computePlayerTitles(history, players);
    expect(result.a).toMatchObject({ title: '覇王' });
    expect(result.c).toMatchObject({ title: '修行中' });
    expect(result.b).toMatchObject({ title: '常勝の雀士', description: 'トップ率1位' });
  });

  it('does not assign a title twice to the same player', () => {
    // Single active player wins everything, but only gets one title (覇王, the highest-priority match).
    const games = [hanchan('g1', 'a', 1, 40000), hanchan('g2', 'a', 1, 40000), hanchan('g3', 'a', 1, 40000)];
    const history = [day('d1', { a: 3000 }, games)];
    const result = computePlayerTitles(history, players);
    expect(result.a).toMatchObject({ title: '覇王' });
  });
});
