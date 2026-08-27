import { describe, expect, it } from 'vitest';
import { computeLatestMilestones } from '../lib/milestones';
import type { DayRecord, GameScore, Player } from '../types';

const players: Player[] = [
  { id: 'a', name: 'Alice', color: '#111111' },
  { id: 'b', name: 'Bob', color: '#222222' },
];

function makeDay(id: string, date: string, scores: GameScore[], profits: Record<string, number>): DayRecord {
  return {
    id,
    date,
    games: [{ id: `${id}-g1`, scores }],
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

function repeatedDay(id: string, date: string, playerId: string, count: number, rank: number): DayRecord {
  return {
    id,
    date,
    games: Array.from({ length: count }, (_, i) => ({
      id: `${id}-g${i}`,
      scores: [{ playerId, rawScore: rank === 1 ? 30000 : -10000, rank, point: 0 }],
    })),
    tableFee: 0,
    chips: {},
    chipRate: 100,
    settlement: { [playerId]: { gamesTotal: 0, chipCount: 0, chipValue: 0, tableFeeShare: 0, totalWithoutFee: 0, totalWithFee: 0 } },
  };
}

describe('computeLatestMilestones', () => {
  it('returns an empty array for empty history', () => {
    expect(computeLatestMilestones([], players)).toEqual([]);
  });

  it('fires a hanchan-count milestone when the latest day crosses a multiple of 50', () => {
    const before = repeatedDay('d1', '2026-01-01T00:00:00.000Z', 'a', 49, 2);
    const latest = repeatedDay('d2', '2026-02-01T00:00:00.000Z', 'a', 1, 2);
    const events = computeLatestMilestones([before, latest], players);
    expect(events).toContainEqual({
      id: 'a:hanchan-count:50',
      playerId: 'a',
      type: 'hanchan-count',
      message: 'Alice が通算 50 半荘を達成！',
    });
  });

  it('does not fire the hanchan-count milestone when no 50-multiple boundary is crossed', () => {
    const before = repeatedDay('d1', '2026-01-01T00:00:00.000Z', 'a', 10, 2);
    const latest = repeatedDay('d2', '2026-02-01T00:00:00.000Z', 'a', 1, 2);
    const events = computeLatestMilestones([before, latest], players);
    expect(events.some((e) => e.type === 'hanchan-count')).toBe(false);
  });

  it('fires top-rate-50 only once the sample reaches the minimum and the rate reaches 50%', () => {
    // before: 5 hanchan (3 losses + 2 wins) -> topRate 0.4 (below threshold, gated since count>=5)
    const beforeGames = repeatedDay('d1', '2026-01-01T00:00:00.000Z', 'a', 3, 2); // 3 losses
    beforeGames.games.push(
      { id: 'd1-w1', scores: [{ playerId: 'a', rawScore: 30000, rank: 1, point: 0 }] },
      { id: 'd1-w2', scores: [{ playerId: 'a', rawScore: 30000, rank: 1, point: 0 }] },
    );
    // latest: 1 more win -> 6 hanchan, 3 wins -> topRate 0.5, crossing the threshold
    const latest = repeatedDay('d2', '2026-02-01T00:00:00.000Z', 'a', 1, 1);
    const events = computeLatestMilestones([beforeGames, latest], players);
    expect(events).toContainEqual({
      id: 'a:top-rate-50',
      playerId: 'a',
      type: 'top-rate-50',
      message: 'Alice のトップ率が50%を突破！',
    });
  });

  it('fires profit-turned-positive only when the player already had a prior track record', () => {
    const before = makeDay('d1', '2026-01-01T00:00:00.000Z', [{ playerId: 'a', rawScore: -1000, rank: 4, point: -500 }], {
      a: -500,
    });
    const latest = makeDay('d2', '2026-02-01T00:00:00.000Z', [{ playerId: 'a', rawScore: 40000, rank: 1, point: 700 }], {
      a: 700,
    });
    const events = computeLatestMilestones([before, latest], players);
    expect(events).toContainEqual({
      id: 'a:profit-turned-positive',
      playerId: 'a',
      type: 'profit-turned-positive',
      message: 'Alice の通算収支が黒字に転換！',
    });
  });

  it('does not fire a profit-sign milestone for a brand-new player with no prior games', () => {
    const latest = makeDay('d1', '2026-02-01T00:00:00.000Z', [{ playerId: 'a', rawScore: 40000, rank: 1, point: 700 }], {
      a: 700,
    });
    const events = computeLatestMilestones([latest], players);
    expect(events.some((e) => e.type === 'profit-turned-positive' || e.type === 'profit-turned-negative')).toBe(false);
  });
});
