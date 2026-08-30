import { describe, expect, it } from 'vitest';
import { computePlayerRankStatuses, RANK_TIERS } from '../lib/rankLevel';
import type { DayRecord, Player } from '../types';

const players: Player[] = [
  { id: 'a', name: 'Alice', color: '#111111' },
  { id: 'b', name: 'Bob', color: '#222222' },
];

function day(id: string, profits: Record<string, number>): DayRecord {
  return {
    id,
    date: '2026-01-01T00:00:00.000Z',
    games: [],
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

describe('computePlayerRankStatuses', () => {
  it('starts everyone at the base tier with zero cumulative profit when nobody has played', () => {
    const result = computePlayerRankStatuses([], players);
    expect(result.a.levelName).toBe(RANK_TIERS[0].name);
    expect(result.a.cumulativeProfit).toBe(0);
    expect(result.a.profitToNextLevel).toBe(RANK_TIERS[1].minProfit);
  });

  it('promotes a player once their cumulative profit crosses a tier threshold', () => {
    const history = [day('d1', { a: 50000, b: -5000 })];
    const result = computePlayerRankStatuses(history, players);
    expect(result.a.levelName).toBe('雀傑1');
    expect(result.a.cumulativeProfit).toBe(50000);
  });

  it('demotes a player when their cumulative profit drops back below a threshold (not permanent like trophies)', () => {
    // Get Alice to 雀傑1 (50000), then a bad day drags her back down.
    const history = [day('d1', { a: 50000, b: -5000 }), day('d2', { a: -30000, b: 30000 })];
    const result = computePlayerRankStatuses(history, players);
    expect(result.a.cumulativeProfit).toBe(20000);
    expect(result.a.levelName).toBe('雀士2');
  });

  it('caps progressRatio at 1 for the top tier and reports no next level', () => {
    const history = [day('d1', { a: 2000000, b: 0 })];
    const result = computePlayerRankStatuses(history, players);
    expect(result.a.levelName).toBe('魂天');
    expect(result.a.nextLevelName).toBeNull();
    expect(result.a.profitToNextLevel).toBeNull();
    expect(result.a.progressRatio).toBe(1);
  });
});
