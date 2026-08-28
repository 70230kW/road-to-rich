import { describe, expect, it } from 'vitest';
import { computeCustomTrophyAchievements } from '../lib/customTrophies';
import type { CustomTrophyDef, DayRecord, Player } from '../types';

const players: Player[] = [
  { id: 'a', name: 'Alice', color: '#111111' },
  { id: 'b', name: 'Bob', color: '#222222' },
];

function day(id: string, dateIso: string, scores: Array<[playerId: string, rawScore: number, rank: number]>, profits: Record<string, number> = {}): DayRecord {
  return {
    id,
    date: dateIso,
    games: [{ id: `${id}-g1`, scores: scores.map(([playerId, rawScore, rank]) => ({ playerId, rawScore, rank, point: 0 })) }],
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

describe('computeCustomTrophyAchievements', () => {
  it('returns empty sets for every player when there are no custom trophies', () => {
    const result = computeCustomTrophyAchievements([], players, []);
    expect(result).toEqual({ a: new Set(), b: new Set() });
  });

  it('unlocks a profitAtLeast trophy once cumulative day-level profit reaches the threshold', () => {
    const trophy: CustomTrophyDef = { id: 't1', name: '', description: '', conditionType: 'profitAtLeast', threshold: 10000 };
    const history = [
      day('d1', '2026-01-01T00:00:00.000Z', [['a', 40000, 1]], { a: 6000 }),
      day('d2', '2026-01-02T00:00:00.000Z', [['a', 40000, 1]], { a: 6000 }),
    ];
    const result = computeCustomTrophyAchievements(history, players, [trophy]);
    expect(result.a.has('t1')).toBe(true); // cumulative 12000 after day 2
    expect(result.b.has('t1')).toBe(false);
  });

  it('unlocks a hanchanCountAtLeast trophy once total hanchans reach the threshold', () => {
    const trophy: CustomTrophyDef = { id: 't2', name: '', description: '', conditionType: 'hanchanCountAtLeast', threshold: 3 };
    const history = [
      day('d1', '2026-01-01T00:00:00.000Z', [['a', 30000, 1]]),
      day('d2', '2026-01-02T00:00:00.000Z', [['a', 30000, 1]]),
    ];
    expect(computeCustomTrophyAchievements(history, players, [trophy]).a.has('t2')).toBe(false); // only 2 hanchan
    history.push(day('d3', '2026-01-03T00:00:00.000Z', [['a', 30000, 1]]));
    expect(computeCustomTrophyAchievements(history, players, [trophy]).a.has('t2')).toBe(true);
  });

  it('unlocks a winStreakAtLeast trophy for consecutive 1st-place finishes, resetting on a non-win', () => {
    const trophy: CustomTrophyDef = { id: 't3', name: '', description: '', conditionType: 'winStreakAtLeast', threshold: 2 };
    const brokenStreak = [
      day('d1', '2026-01-01T00:00:00.000Z', [['a', 40000, 1]]),
      day('d2', '2026-01-02T00:00:00.000Z', [['a', 10000, 3]]),
      day('d3', '2026-01-03T00:00:00.000Z', [['a', 40000, 1]]),
    ];
    expect(computeCustomTrophyAchievements(brokenStreak, players, [trophy]).a.has('t3')).toBe(false);

    const realStreak = [...brokenStreak, day('d4', '2026-01-04T00:00:00.000Z', [['a', 40000, 1]])];
    expect(computeCustomTrophyAchievements(realStreak, players, [trophy]).a.has('t3')).toBe(true);
  });

  it('unlocks a tobiCountAtLeast trophy once negative-rawScore occurrences reach the threshold', () => {
    const trophy: CustomTrophyDef = { id: 't4', name: '', description: '', conditionType: 'tobiCountAtLeast', threshold: 2 };
    const history = [
      day('d1', '2026-01-01T00:00:00.000Z', [['a', -1000, 4]]),
      day('d2', '2026-01-02T00:00:00.000Z', [['a', -1000, 4]]),
    ];
    expect(computeCustomTrophyAchievements(history, players, [trophy]).a.has('t4')).toBe(true);
  });

  it('unlocks a topRateAtLeast trophy only once the minimum hanchan sample is reached', () => {
    const trophy: CustomTrophyDef = { id: 't5', name: '', description: '', conditionType: 'topRateAtLeast', threshold: 100 };
    // 9 wins in a row is below the 10-hanchan minimum sample -> not yet unlocked.
    const nineWins = Array.from({ length: 9 }, (_, i) => day(`d${i}`, `2026-01-0${i + 1}T00:00:00.000Z`, [['a', 40000, 1]]));
    expect(computeCustomTrophyAchievements(nineWins, players, [trophy]).a.has('t5')).toBe(false);
    const tenWins = [...nineWins, day('d10', '2026-01-10T00:00:00.000Z', [['a', 40000, 1]])];
    expect(computeCustomTrophyAchievements(tenWins, players, [trophy]).a.has('t5')).toBe(true);
  });
});
