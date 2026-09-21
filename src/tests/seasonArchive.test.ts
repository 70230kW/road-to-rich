import { describe, expect, it } from 'vitest';
import { computeSeasonSnapshot, getSeasonDays } from '../lib/seasonArchive';
import type { DayRecord, LeagueSeason, Player } from '../types';

const players: Player[] = [
  { id: 'a', name: 'Alice', color: '#111111' },
  { id: 'b', name: 'Bob', color: '#222222' },
];

const season: LeagueSeason = {
  id: 'season-1', name: '2026 AUTUMN', startDate: '2026-09-01', endDate: '2026-11-30', status: 'archived', createdAt: '2026-09-01T00:00:00.000Z',
};

function day(id: string, date: string, seasonId?: string): DayRecord {
  return {
    id, date, seasonId,
    games: [{ id: `${id}-g`, scores: [{ playerId: 'a', rawScore: 40000, rank: 1, point: 1000 }, { playerId: 'b', rawScore: 20000, rank: 2, point: -1000 }] }],
    tableFee: 0, chips: { a: 0, b: 0 }, chipRate: 100,
    settlement: {
      a: { gamesTotal: 1000, chipCount: 0, chipValue: 0, tableFeeShare: 0, totalWithoutFee: 1000, totalWithFee: 1000 },
      b: { gamesTotal: -1000, chipCount: 0, chipValue: 0, tableFeeShare: 0, totalWithoutFee: -1000, totalWithFee: -1000 },
    },
  };
}

describe('season archive', () => {
  it('includes explicitly assigned records and legacy records inside the date range', () => {
    const history = [
      day('explicit', '2026-12-10T00:00:00.000Z', 'season-1'),
      day('legacy-in-range', '2026-10-10T00:00:00.000Z'),
      day('legacy-outside', '2026-05-10T00:00:00.000Z'),
      day('other-season', '2026-10-11T00:00:00.000Z', 'season-2'),
    ];
    expect(getSeasonDays(history, season).map((record) => record.id)).toEqual(['explicit', 'legacy-in-range']);
  });

  it('computes champion, hanchan count and percentage leaders', () => {
    const snapshot = computeSeasonSnapshot([day('d1', '2026-10-10T00:00:00.000Z')], players, season);
    expect(snapshot.champion?.name).toBe('Alice');
    expect(snapshot.hanchanCount).toBe(1);
    expect(snapshot.topRateLeader).toMatchObject({ name: 'Alice', topCount: 1, hanchanCount: 1, rate: 1 });
    expect(snapshot.rentaiRateLeader).toMatchObject({ name: 'Alice', rentaiCount: 1, hanchanCount: 1, rate: 1 });
    expect(snapshot.lastAvoidanceLeader).toMatchObject({ name: 'Alice', lastCount: 0, hanchanCount: 1, rate: 1 });
    expect(snapshot.averageRawScoreLeader).toMatchObject({ name: 'Alice', rawScoreTotal: 40000, hanchanCount: 1, average: 40000 });
  });

  it('ranks top rate instead of the raw number of first-place finishes', () => {
    const aliceWin = day('d1', '2026-10-10T00:00:00.000Z');
    const bobWin = day('d2', '2026-10-11T00:00:00.000Z');
    bobWin.games[0].scores = [
      { playerId: 'b', rawScore: 40000, rank: 1, point: 1000 },
      { playerId: 'guest', rawScore: 20000, rank: 2, point: -1000 },
    ];

    const snapshot = computeSeasonSnapshot([aliceWin, bobWin], players, season);
    expect(snapshot.topRateLeader).toMatchObject({ name: 'Alice', topCount: 1, hanchanCount: 1, rate: 1 });
    expect(snapshot.rentaiRateLeader).toMatchObject({ name: 'Bob', rentaiCount: 2, hanchanCount: 2, rate: 1 });
    expect(snapshot.lastAvoidanceLeader).toMatchObject({ name: 'Alice', lastCount: 0, hanchanCount: 1, rate: 1 });
    expect(snapshot.averageRawScoreLeader).toMatchObject({ name: 'Alice', rawScoreTotal: 40000, hanchanCount: 1, average: 40000 });
  });
});
