import { describe, expect, it } from 'vitest';
import { computeGoalProgress } from '../lib/goals';
import type { DayRecord, Player, PlayerGoal } from '../types';

const players: Player[] = [
  { id: 'a', name: 'Alice', color: '#111111' },
  { id: 'b', name: 'Bob', color: '#222222' },
];

function day(id: string, dateIso: string, scores: Array<[string, number]>, profits: Record<string, number>): DayRecord {
  return {
    id,
    date: dateIso,
    games: [{ id: `${id}-g1`, scores: scores.map(([playerId, rawScore], i) => ({ playerId, rawScore, rank: i + 1, point: 0 })) }],
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

describe('computeGoalProgress', () => {
  it('returns null for a player with no goal set', () => {
    const result = computeGoalProgress([], players, {}, new Date('2026-06-15T00:00:00.000Z'));
    expect(result.a).toBeNull();
  });

  it('tracks progress toward a profit goal using only this-month history', () => {
    const goals: Record<string, PlayerGoal> = { a: { type: 'profit', target: 10000 } };
    const history = [
      day('d1', '2026-06-10T00:00:00.000Z', [['a', 40000], ['b', 10000]], { a: 5000, b: -5000 }),
      day('d2', '2026-05-10T00:00:00.000Z', [['a', 40000], ['b', 10000]], { a: 9000, b: -9000 }), // outside the month, ignored
    ];
    const result = computeGoalProgress(history, players, goals, new Date('2026-06-20T00:00:00.000Z'));
    expect(result.a).toMatchObject({ currentValue: 5000, progressRatio: 0.5, achieved: false });
  });

  it('marks a profit goal achieved once the current value reaches the target', () => {
    const goals: Record<string, PlayerGoal> = { a: { type: 'profit', target: 5000 } };
    const history = [day('d1', '2026-06-10T00:00:00.000Z', [['a', 40000], ['b', 10000]], { a: 5000, b: -5000 })];
    const result = computeGoalProgress(history, players, goals, new Date('2026-06-20T00:00:00.000Z'));
    expect(result.a?.achieved).toBe(true);
  });

  it('tracks a topRate goal as a 0-100 percentage', () => {
    const goals: Record<string, PlayerGoal> = { a: { type: 'topRate', target: 50 } };
    const history = [
      day('d1', '2026-06-01T00:00:00.000Z', [['a', 40000], ['b', 10000]], { a: 0, b: 0 }),
      day('d2', '2026-06-02T00:00:00.000Z', [['b', 40000], ['a', 10000]], { a: 0, b: 0 }),
    ];
    const result = computeGoalProgress(history, players, goals, new Date('2026-06-20T00:00:00.000Z'));
    expect(result.a).toMatchObject({ currentValue: 50, progressRatio: 1, achieved: true });
  });
});
