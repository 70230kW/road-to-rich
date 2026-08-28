import { describe, expect, it } from 'vitest';
import { computePlayerRankStatuses, RANK_TIERS } from '../lib/rankLevel';
import { defaultSettings } from '../lib/defaults';
import type { DayRecord, Player } from '../types';

const players: Player[] = [
  { id: 'a', name: 'Alice', color: '#111111' },
  { id: 'b', name: 'Bob', color: '#222222' },
];

function day(id: string, scores: Array<[playerId: string, rawScore: number]>): DayRecord {
  return {
    id,
    date: '2026-01-01T00:00:00.000Z',
    games: [{ id: `${id}-g1`, scores: scores.map(([playerId, rawScore], i) => ({ playerId, rawScore, rank: i + 1, point: 0 })) }],
    tableFee: 0,
    chips: {},
    chipRate: 100,
    settlement: {},
  };
}

describe('computePlayerRankStatuses', () => {
  it('starts everyone at the base tier with zero cumulative pt when nobody has played', () => {
    const result = computePlayerRankStatuses([], players, defaultSettings);
    expect(result.a.levelName).toBe(RANK_TIERS[0].name);
    expect(result.a.cumulativePt).toBe(0);
    expect(result.a.ptToNextLevel).toBe(RANK_TIERS[1].minPt);
  });

  it('promotes a player once their cumulative pt crosses a tier threshold', () => {
    // rawScore 85000 vs initialScore 25000 -> pt = 60, exactly 雀傑1's threshold
    const history = [day('d1', [['a', 85000], ['b', 15000]])];
    const result = computePlayerRankStatuses(history, players, defaultSettings);
    expect(result.a.levelName).toBe('雀傑1');
    expect(result.a.cumulativePt).toBe(60);
  });

  it('demotes a player when their cumulative pt drops back below a threshold (not permanent like trophies)', () => {
    // Get Alice to 雀傑1 (pt=60), then a bad hanchan drags her back down.
    const history = [
      day('d1', [['a', 85000], ['b', 15000]]),
      day('d2', [['b', 85000], ['a', -15000]]), // a: -40pt this hanchan -> cumulative 20
    ];
    const result = computePlayerRankStatuses(history, players, defaultSettings);
    expect(result.a.cumulativePt).toBe(20);
    expect(result.a.levelName).toBe('雀士2');
  });

  it('caps progressRatio at 1 for the top tier and reports no next level', () => {
    const history = [day('d1', [['a', 700000 + defaultSettings.initialScore], ['b', 0]])];
    const result = computePlayerRankStatuses(history, players, defaultSettings);
    expect(result.a.levelName).toBe('魂天');
    expect(result.a.nextLevelName).toBeNull();
    expect(result.a.ptToNextLevel).toBeNull();
    expect(result.a.progressRatio).toBe(1);
  });
});
