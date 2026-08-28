import { describe, expect, it } from 'vitest';
import { computeHallOfFame } from '../lib/hallOfFame';
import type { DayRecord, Player } from '../types';

const players: Player[] = [
  { id: 'a', name: 'Alice', color: '#111111' },
  { id: 'b', name: 'Bob', color: '#222222' },
  { id: 'c', name: 'Carolina', color: '#333333' },
];

function day(id: string, date: string, games: DayRecord['games']): DayRecord {
  return { id, date, games, tableFee: 0, chips: {}, chipRate: 100, settlement: {} };
}

describe('computeHallOfFame', () => {
  it('returns all-null records for empty history', () => {
    expect(computeHallOfFame([], players)).toEqual({ blowout: null, comeback: null, nailbiter: null, bust: null });
  });

  it('picks the largest 1st-vs-2nd rawScore gap as the blowout, and the smallest as the nailbiter', () => {
    const history = [
      day('d1', '2026-01-01T00:00:00.000Z', [
        { id: 'g1', scores: [{ playerId: 'a', rawScore: 60000, rank: 1, point: 0 }, { playerId: 'b', rawScore: 20000, rank: 2, point: 0 }] },
        { id: 'g2', scores: [{ playerId: 'c', rawScore: 26000, rank: 1, point: 0 }, { playerId: 'a', rawScore: 25000, rank: 2, point: 0 }] },
      ]),
    ];
    const result = computeHallOfFame(history, players);
    expect(result.blowout).toMatchObject({ playerId: 'a', value: 40000, opponentName: 'Bob' });
    expect(result.nailbiter).toMatchObject({ playerId: 'c', value: 1000, opponentName: 'Alice' });
  });

  it('picks the most negative rawScore across all games as the bust', () => {
    const history = [
      day('d1', '2026-01-01T00:00:00.000Z', [
        { id: 'g1', scores: [{ playerId: 'a', rawScore: -30000, rank: 4, point: 0 }, { playerId: 'b', rawScore: 50000, rank: 1, point: 0 }] },
      ]),
    ];
    const result = computeHallOfFame(history, players);
    expect(result.bust).toMatchObject({ playerId: 'a', value: -30000 });
  });

  it('detects a comeback: recovering from a negative running total within the same day', () => {
    const history = [
      day('d1', '2026-01-01T00:00:00.000Z', [
        { id: 'g1', scores: [{ playerId: 'a', rawScore: 10000, rank: 3, point: -3000 }] },
        { id: 'g2', scores: [{ playerId: 'a', rawScore: 50000, rank: 1, point: 8000 }] },
      ]),
    ];
    const result = computeHallOfFame(history, players);
    // running: 0 -> -3000 -> 5000. min=-3000, final=5000, comeback=8000
    expect(result.comeback).toMatchObject({ playerId: 'a', value: 8000, lowPoint: -3000 });
  });

  it('does not count a single-hanchan day as a comeback even if it started the day negative', () => {
    const history = [day('d1', '2026-01-01T00:00:00.000Z', [{ id: 'g1', scores: [{ playerId: 'a', rawScore: 50000, rank: 1, point: 8000 }] }])];
    const result = computeHallOfFame(history, players);
    expect(result.comeback).toBeNull();
  });

  it('does not count a day that only got worse (no recovery) as a comeback', () => {
    const history = [
      day('d1', '2026-01-01T00:00:00.000Z', [
        { id: 'g1', scores: [{ playerId: 'a', rawScore: 10000, rank: 3, point: -1000 }] },
        { id: 'g2', scores: [{ playerId: 'a', rawScore: 5000, rank: 4, point: -2000 }] },
      ]),
    ];
    const result = computeHallOfFame(history, players);
    expect(result.comeback).toBeNull();
  });
});
