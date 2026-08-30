import { describe, expect, it } from 'vitest';
import { computePlayerRankStatuses, groupRankTiers, RANK_TIERS } from '../lib/rankLevel';
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
  it('starts everyone at 雀士1 with zero cumulative profit when nobody has played', () => {
    const result = computePlayerRankStatuses([], players);
    expect(result.a.levelName).toBe('雀士1');
    expect(result.a.group).toBe('雀士');
    expect(result.a.cumulativeProfit).toBe(0);
    expect(result.a.profitToNextLevel).toBe(10000);
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

  it('keeps a player in 雀士1 while their loss is at most ¥15,000 (not yet 地底人)', () => {
    const history = [day('d1', { a: -15000, b: 0 })];
    const result = computePlayerRankStatuses(history, players);
    expect(result.a.levelName).toBe('雀士1');
    expect(result.a.group).toBe('雀士');
  });

  it('places a player into the 地底人 group once their loss exceeds ¥15,000', () => {
    const history = [day('d1', { a: -20000, b: 0 })];
    const result = computePlayerRankStatuses(history, players);
    expect(result.a.levelName).toBe('地底人1');
    expect(result.a.group).toBe('地底人');
    expect(result.a.nextLevelName).toBe('雀士1');
  });

  it('floors extremely negative profit at the deepest 地底人 tier without going below it', () => {
    const history = [day('d1', { a: -9999999, b: 0 })];
    const result = computePlayerRankStatuses(history, players);
    expect(result.a.levelName).toBe('地底人3');
    expect(result.a.progressRatio).toBe(0);
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

describe('groupRankTiers', () => {
  it('collapses consecutive same-group tiers into one summary each, in ascending order', () => {
    const groups = groupRankTiers();
    expect(groups.map((g) => g.group)).toEqual(['地底人', '雀士', '雀傑', '雀豪', '雀聖', '魂天']);
    // every RANK_TIERS entry should be accounted for exactly once
    expect(groups.reduce((sum, g) => sum + g.levels.length, 0)).toBe(RANK_TIERS.length);
  });

  it('sets each group\'s maxProfitExclusive to the next group\'s minProfit, and null for the last group', () => {
    const groups = groupRankTiers();
    const jansi = groups.find((g) => g.group === '雀士')!;
    const jankai = groups.find((g) => g.group === '雀傑')!;
    expect(jansi.minProfit).toBe(-15000);
    expect(jansi.maxProfitExclusive).toBe(jankai.minProfit);
    expect(groups[groups.length - 1].maxProfitExclusive).toBeNull();
  });
});
