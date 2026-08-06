import { describe, expect, it } from 'vitest';
import { computeDashboardStats, computeRadarStats, computeRanking } from '../lib/stats';
import type { DayRecord, Player } from '../types';

const players: Player[] = [
  { id: 'a', name: 'Alice' },
  { id: 'b', name: 'Bob' },
];

const history: DayRecord[] = [
  {
    id: 'day1',
    date: '2026-01-01T00:00:00.000Z',
    tableFee: 1000,
    chipRate: 100,
    chips: { a: 1, b: -1 },
    games: [
      {
        id: 'g1',
        scores: [
          { playerId: 'a', rawScore: 30000, rank: 1, point: 500 },
          { playerId: 'b', rawScore: 20000, rank: 2, point: -500 },
        ],
      },
    ],
    settlement: {
      a: { gamesTotal: 500, chipCount: 1, chipValue: 100, tableFeeShare: 100, totalWithoutFee: 600, totalWithFee: 500 },
      b: { gamesTotal: -500, chipCount: -1, chipValue: -100, tableFeeShare: 100, totalWithoutFee: -600, totalWithFee: -700 },
    },
  },
  {
    id: 'day2',
    date: '2026-01-08T00:00:00.000Z',
    tableFee: 1000,
    chipRate: 100,
    chips: { a: 0, b: 5 },
    games: [
      {
        id: 'g2',
        scores: [
          { playerId: 'a', rawScore: 28000, rank: 1, point: 300 },
          { playerId: 'b', rawScore: 22000, rank: 2, point: -300 },
        ],
      },
    ],
    settlement: {
      a: { gamesTotal: 300, chipCount: 0, chipValue: 0, tableFeeShare: 100, totalWithoutFee: 300, totalWithFee: 200 },
      b: { gamesTotal: -300, chipCount: 5, chipValue: 500, tableFeeShare: 100, totalWithoutFee: -300, totalWithFee: -400 },
    },
  },
];

describe('computeRanking', () => {
  it('ranks by 場代抜き total profit, not 場代込み', () => {
    const rows = computeRanking(history, players);
    // Alice: 600+300=900 without-fee vs 500+200=700 with-fee (still positive either way)
    // Bob: -600-300=-900 without-fee vs -700-400=-1100 with-fee
    expect(rows.map((r) => r.playerId)).toEqual(['a', 'b']);
    expect(rows[0]).toMatchObject({ totalProfitWithoutFee: 900, totalProfitWithFee: 700 });
    expect(rows[1]).toMatchObject({ totalProfitWithoutFee: -900, totalProfitWithFee: -1100 });
  });

  it('sorts by totalProfitWithoutFee even when it disagrees with totalProfitWithFee ordering', () => {
    // Alice is #1 by both fields here, so flip the fixture so only totalProfitWithoutFee favors Bob.
    const flipped: DayRecord[] = [
      {
        ...history[0],
        settlement: {
          a: { gamesTotal: 100, chipCount: 0, chipValue: 0, tableFeeShare: 500, totalWithoutFee: 100, totalWithFee: -400 },
          b: { gamesTotal: -100, chipCount: 0, chipValue: 0, tableFeeShare: 0, totalWithoutFee: 200, totalWithFee: 200 },
        },
      },
    ];
    const rows = computeRanking(flipped, players);
    expect(rows[0].playerId).toBe('b');
  });

  it('computes avgRank and avgChips', () => {
    const rows = computeRanking(history, players);
    const alice = rows.find((r) => r.playerId === 'a')!;
    const bob = rows.find((r) => r.playerId === 'b')!;
    expect(alice.avgRank).toBe(1);
    expect(bob.avgRank).toBe(2);
    expect(alice.avgChips).toBe(0.5);
    expect(bob.avgChips).toBe(2);
  });

  it('exposes dayCount (days participated), same for both players in this fixture', () => {
    const rows = computeRanking(history, players);
    expect(rows.find((r) => r.playerId === 'a')!.dayCount).toBe(2);
    expect(rows.find((r) => r.playerId === 'b')!.dayCount).toBe(2);
  });
});

describe('computeDashboardStats', () => {
  it('finds the best (lowest) average rank', () => {
    const stats = computeDashboardStats(history, players);
    expect(stats.bestAvgRank).toEqual({ value: 1, playerName: 'Alice' });
  });

  it('finds the highest single-day chip count', () => {
    const stats = computeDashboardStats(history, players);
    expect(stats.bestDailyChips).toEqual({ value: 5, playerName: 'Bob' });
  });

  it('still computes the pre-existing stats', () => {
    const stats = computeDashboardStats(history, players);
    expect(stats.highestScore).toEqual({ value: 30000, playerName: 'Alice' });
    expect(stats.bestDailyWin).toEqual({ value: 500, playerName: 'Alice' });
  });

  it('finds who has played the most hanchan and the most days', () => {
    // Bob sits out day2's second game so he clearly trails on hanchanCount, then
    // plays an extra day3 alone so he clearly leads on dayCount.
    const extra: DayRecord[] = [
      ...history,
      {
        id: 'day3',
        date: '2026-01-15T00:00:00.000Z',
        tableFee: 0,
        chipRate: 100,
        chips: { b: 0 },
        games: [
          { id: 'g3', scores: [{ playerId: 'b', rawScore: 30000, rank: 1, point: 500 }] },
          { id: 'g4', scores: [{ playerId: 'b', rawScore: 30000, rank: 1, point: 500 }] },
        ],
        settlement: {
          b: { gamesTotal: 1000, chipCount: 0, chipValue: 0, tableFeeShare: 0, totalWithoutFee: 1000, totalWithFee: 1000 },
        },
      },
    ];
    const stats = computeDashboardStats(extra, players);
    expect(stats.mostHanchansPlayed).toEqual({ value: 4, playerName: 'Bob' });
    expect(stats.mostDaysPlayed).toEqual({ value: 3, playerName: 'Bob' });
  });

  it('returns nulls when history is empty', () => {
    const stats = computeDashboardStats([], players);
    expect(stats.bestAvgRank).toBeNull();
    expect(stats.bestDailyChips).toBeNull();
    expect(stats.mostHanchansPlayed).toBeNull();
    expect(stats.mostDaysPlayed).toBeNull();
  });
});

describe('computeRadarStats', () => {
  it('aggregates per-player axes and inverts avgRank so better is larger', () => {
    const rows = computeRadarStats(history, players);
    const alice = rows.find((r) => r.playerId === 'a')!;
    const bob = rows.find((r) => r.playerId === 'b')!;

    expect(alice.chipTotal).toBe(1);
    expect(alice.highestScore).toBe(30000);
    expect(alice.avgRank).toBe(1);
    expect(alice.avgRawScore).toBe(29000);
    expect(alice.bestDailyWin).toBe(500);

    expect(bob.chipTotal).toBe(4);
    expect(bob.avgRank).toBe(2);

    // 2-player games: ranks are 1..2, so inverted = 3 - avgRank.
    expect(alice.avgRankInverted).toBe(2);
    expect(bob.avgRankInverted).toBe(1);
    expect(alice.avgRankInverted).toBeGreaterThan(bob.avgRankInverted);
  });

  it('omits players with no recorded games', () => {
    const rows = computeRadarStats(history, [...players, { id: 'c', name: 'Carol' }]);
    expect(rows.some((r) => r.playerId === 'c')).toBe(false);
  });
});
