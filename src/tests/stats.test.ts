import { describe, expect, it } from 'vitest';
import {
  computeDashboardStats,
  computePlayerRateStats,
  computePlayerYakumanAchievements,
  computeRadarStats,
  computeRankCounts,
  computeRanking,
  computeYakumanAchievements,
} from '../lib/stats';
import type { DayRecord, Player } from '../types';

const players: Player[] = [
  { id: 'a', name: 'Alice', color: '#06b6d4' },
  { id: 'b', name: 'Bob', color: '#e879f9' },
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

describe('computeRankCounts', () => {
  it('counts how many times each player took each finishing rank', () => {
    const counts = computeRankCounts(history, players);
    // Alice took 1着 both hanchan, Bob took 2着 both hanchan.
    expect(counts.a).toEqual([2, 0]);
    expect(counts.b).toEqual([0, 2]);
  });

  it('pads every player array to the highest rank seen, even players with no games', () => {
    const counts = computeRankCounts(history, [...players, { id: 'c', name: 'Carol', color: '#34d399' }]);
    expect(counts.c).toEqual([0, 0]);
  });

  it('returns empty arrays for every player when history is empty', () => {
    const counts = computeRankCounts([], players);
    expect(counts.a).toEqual([]);
    expect(counts.b).toEqual([]);
  });
});

describe('computePlayerRateStats', () => {
  it('computes トップ率/連対率/ラス率 from recorded ranks (2-player games: rank 2 is also last place)', () => {
    const rates = computePlayerRateStats(history, players);
    expect(rates.a).toEqual({ topRate: 1, rentaiRate: 1, lastRate: 0, tobiRate: 0 });
    expect(rates.b).toEqual({ topRate: 0, rentaiRate: 1, lastRate: 1, tobiRate: 0 });
  });

  it('computes トビ率 from hanchans where the raw score went negative', () => {
    const withTobi: DayRecord[] = [
      {
        ...history[0],
        games: [
          {
            id: 'g3',
            scores: [
              { playerId: 'a', rawScore: 55000, rank: 1, point: 3000 },
              { playerId: 'b', rawScore: -5000, rank: 2, point: -3000 },
            ],
          },
        ],
      },
    ];
    const rates = computePlayerRateStats(withTobi, players);
    expect(rates.a.tobiRate).toBe(0);
    expect(rates.b.tobiRate).toBe(1);
  });

  it('returns nulls for a player with no recorded hanchan', () => {
    const rates = computePlayerRateStats(history, [...players, { id: 'c', name: 'Carol', color: '#34d399' }]);
    expect(rates.c).toEqual({ topRate: null, rentaiRate: null, lastRate: null, tobiRate: null });
  });
});

describe('computeDashboardStats', () => {
  it('finds the best (lowest) average rank', () => {
    const stats = computeDashboardStats(history, players);
    expect(stats.bestAvgRank).toEqual({ value: 1, playerId: 'a', playerName: 'Alice' });
  });

  it('finds the highest single-day chip count', () => {
    const stats = computeDashboardStats(history, players);
    expect(stats.bestDailyChips).toEqual({ value: 5, playerId: 'b', playerName: 'Bob' });
  });

  it('still computes the pre-existing stats', () => {
    const stats = computeDashboardStats(history, players);
    expect(stats.highestScore).toEqual({ value: 30000, playerId: 'a', playerName: 'Alice' });
    expect(stats.bestDailyWin).toEqual({ value: 500, playerId: 'a', playerName: 'Alice' });
  });

  it('finds who has played the most hanchan', () => {
    // Bob plays an extra day3 with two more hanchan, clearly leading hanchanCount.
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
    expect(stats.mostHanchansPlayed).toEqual({ value: 4, playerId: 'b', playerName: 'Bob' });
  });

  it('finds who has the best average 場代抜き profit per day played', () => {
    const stats = computeDashboardStats(history, players);
    // Alice: (600 + 300) / 2 days = 450. Bob: (-600 + -300) / 2 days = -450.
    expect(stats.bestAvgDailyWin).toEqual({ value: 450, playerId: 'a', playerName: 'Alice' });
  });

  it('returns nulls when history is empty', () => {
    const stats = computeDashboardStats([], players);
    expect(stats.bestAvgRank).toBeNull();
    expect(stats.bestDailyChips).toBeNull();
    expect(stats.mostHanchansPlayed).toBeNull();
    expect(stats.bestAvgDailyWin).toBeNull();
  });
});

describe('computeRadarStats', () => {
  it('aggregates per-player axes', () => {
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
  });

  it('omits players with no recorded games', () => {
    const rows = computeRadarStats(history, [...players, { id: 'c', name: 'Carol', color: '#34d399' }]);
    expect(rows.some((r) => r.playerId === 'c')).toBe(false);
  });
});

describe('computeYakumanAchievements', () => {
  it('groups occurrences by yakumanId, including compound and repeated events', () => {
    const withYakuman: DayRecord[] = [
      {
        ...history[0],
        games: [
          {
            ...history[0].games[0],
            yakumanEvents: [
              { id: 'e1', playerId: 'a', yakumanIds: ['daisangen', 'suuankou'] },
              { id: 'e2', playerId: 'b', yakumanIds: ['kokushi'] },
            ],
          },
        ],
      },
      {
        ...history[1],
        games: [{ ...history[1].games[0], yakumanEvents: [{ id: 'e3', playerId: 'a', yakumanIds: ['daisangen'] }] }],
      },
    ];
    const result = computeYakumanAchievements(withYakuman, players);
    expect(result.daisangen).toEqual([
      { playerId: 'a', playerName: 'Alice', date: history[0].date },
      { playerId: 'a', playerName: 'Alice', date: history[1].date },
    ]);
    expect(result.suuankou).toEqual([{ playerId: 'a', playerName: 'Alice', date: history[0].date }]);
    expect(result.kokushi).toEqual([{ playerId: 'b', playerName: 'Bob', date: history[0].date }]);
    expect(result.tenho).toBeUndefined();
  });

  it('returns an empty object when no games have yakumanEvents', () => {
    expect(computeYakumanAchievements(history, players)).toEqual({});
  });
});

describe('computePlayerYakumanAchievements', () => {
  const withYakuman: DayRecord[] = [
    {
      ...history[0],
      games: [
        {
          ...history[0].games[0],
          yakumanEvents: [{ id: 'e1', playerId: 'a', yakumanIds: ['daisangen', 'suuankou'] }],
        },
      ],
    },
    {
      ...history[1],
      games: [{ ...history[1].games[0], yakumanEvents: [{ id: 'e2', playerId: 'a', yakumanIds: ['kokushi'] }] }],
    },
  ];

  it('lists each achieved yakuman (including compound events) per player, most recent first', () => {
    const result = computePlayerYakumanAchievements(withYakuman, players);
    expect(result.a).toEqual([
      { yakumanId: 'kokushi', date: history[1].date },
      { yakumanId: 'daisangen', date: history[0].date },
      { yakumanId: 'suuankou', date: history[0].date },
    ]);
  });

  it('returns an empty array for players with no yakumanEvents', () => {
    const result = computePlayerYakumanAchievements(withYakuman, players);
    expect(result.b).toEqual([]);
  });

  it('returns empty arrays for every player when no games have yakumanEvents', () => {
    const result = computePlayerYakumanAchievements(history, players);
    expect(result.a).toEqual([]);
    expect(result.b).toEqual([]);
  });
});
