import { describe, expect, it } from 'vitest';
import { computeMonthlyHighlights } from '../lib/monthlyHighlights';
import type { DayRecord, Player } from '../types';

const players: Player[] = [
  { id: 'a', name: 'Alice', color: '#111111' },
  { id: 'b', name: 'Bob', color: '#222222' },
];

function day(id: string, date: string, scores: Array<[string, number]>, profits: Record<string, number>): DayRecord {
  return {
    id,
    date,
    games: [
      {
        id: `${id}-g1`,
        scores: scores.map(([playerId, rawScore], idx) => ({ playerId, rawScore, rank: idx + 1, point: 0 })),
      },
    ],
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

describe('computeMonthlyHighlights', () => {
  it('returns hasData:false with no highlights when nothing was played that month', () => {
    const result = computeMonthlyHighlights([], players, new Date('2026-06-15T00:00:00.000Z'));
    expect(result).toEqual({ year: 2026, month: 6, hasData: false, mvp: null, worst: null, mostTobi: null });
  });

  it('only considers days within the reference month/year', () => {
    const history = [
      day('d1', '2026-06-10T00:00:00.000Z', [['a', 40000], ['b', 10000]], { a: 5000, b: -5000 }),
      day('d2', '2026-05-10T00:00:00.000Z', [['a', -10000], ['b', 60000]], { a: -9000, b: 9000 }),
    ];
    const result = computeMonthlyHighlights(history, players, new Date('2026-06-15T00:00:00.000Z'));
    expect(result.hasData).toBe(true);
    expect(result.mvp?.playerId).toBe('a');
    expect(result.mvp?.value).toBe(5000);
    expect(result.worst?.playerId).toBe('b');
  });

  it('picks the player with the most tobi (negative rawScore) occurrences that month', () => {
    const history = [
      day('d1', '2026-06-01T00:00:00.000Z', [['a', -1000], ['b', 20000]], { a: -1000, b: 1000 }),
      day('d2', '2026-06-02T00:00:00.000Z', [['a', -2000], ['b', 30000]], { a: -2000, b: 2000 }),
    ];
    const result = computeMonthlyHighlights(history, players, new Date('2026-06-20T00:00:00.000Z'));
    expect(result.mostTobi).toEqual({ playerId: 'a', name: 'Alice', value: 2 });
  });

  it('returns mostTobi:null when nobody busted that month', () => {
    const history = [day('d1', '2026-06-01T00:00:00.000Z', [['a', 30000], ['b', 20000]], { a: 1000, b: -1000 })];
    const result = computeMonthlyHighlights(history, players, new Date('2026-06-20T00:00:00.000Z'));
    expect(result.mostTobi).toBeNull();
  });
});
