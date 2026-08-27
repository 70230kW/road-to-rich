import { describe, expect, it } from 'vitest';
import { computeCatchUpToLeader, computeSimulatorRows } from '../lib/simulator';
import type { DayRecord, Player } from '../types';

const players: Player[] = [
  { id: 'a', name: 'Alice', color: '#111111' },
  { id: 'b', name: 'Bob', color: '#222222' },
];

function historyWithProfits(entries: Array<[playerId: string, hanchanCount: number, totalProfit: number]>): DayRecord[] {
  const games = entries.flatMap(([playerId, hanchanCount]) =>
    Array.from({ length: hanchanCount }, (_, i) => ({
      id: `${playerId}-g${i}`,
      scores: [{ playerId, rawScore: 0, rank: 1, point: 0 }],
    })),
  );
  const settlement = Object.fromEntries(
    entries.map(([playerId, , totalProfit]) => [
      playerId,
      { gamesTotal: totalProfit, chipCount: 0, chipValue: 0, tableFeeShare: 0, totalWithoutFee: totalProfit, totalWithFee: totalProfit },
    ]),
  );
  return [{ id: 'd1', date: '2026-01-01T00:00:00.000Z', games, tableFee: 0, chips: {}, chipRate: 100, settlement }];
}

describe('computeSimulatorRows', () => {
  it('projects future profit using the current average pace, sorted by projected profit', () => {
    const history = historyWithProfits([
      ['a', 10, 5000], // avg 500/hanchan
      ['b', 10, 2000], // avg 200/hanchan
    ]);
    const rows = computeSimulatorRows(history, players, 10);
    expect(rows[0].playerId).toBe('a');
    expect(rows[0].avgProfitPerHanchan).toBe(500);
    expect(rows[0].projectedProfit).toBe(5000 + 500 * 10);
    expect(rows[1].projectedProfit).toBe(2000 + 200 * 10);
  });

  it('returns null avg/projected profit for a player with no recorded hanchan', () => {
    const rows = computeSimulatorRows([], players, 10);
    rows.forEach((r) => {
      expect(r.avgProfitPerHanchan).toBeNull();
      expect(r.projectedProfit).toBeNull();
    });
  });

  it('treats a negative futureHanchans as zero (no projection beyond current)', () => {
    const history = historyWithProfits([['a', 5, 1000]]);
    const rows = computeSimulatorRows(history, players, -5);
    const alice = rows.find((r) => r.playerId === 'a')!;
    expect(alice.projectedProfit).toBe(1000);
  });
});

describe('computeCatchUpToLeader', () => {
  it('computes hanchans needed for a trailing player with a better pace to catch the leader', () => {
    // leader: 10 hanchan, 5000 total -> avg 500. trailing: 10 hanchan, 0 total -> avg 0, but pace improves relative? use better avg example below.
    const history = historyWithProfits([
      ['a', 10, 5000], // leader, avg 500
      ['b', 5, 3000], // avg 600 > leader avg -> can catch up
    ]);
    const result = computeCatchUpToLeader(history, players);
    const bob = result.find((r) => r.playerId === 'b')!;
    // deficit = 5000-3000=2000, rate diff = 600-500=100 -> ceil(2000/100)=20
    expect(bob.hanchansNeeded).toBe(20);
  });

  it('returns null hanchansNeeded when the trailing player cannot catch up at their current pace', () => {
    const history = historyWithProfits([
      ['a', 10, 5000], // leader, avg 500
      ['b', 10, 1000], // avg 100 < leader avg -> can't catch up
    ]);
    const result = computeCatchUpToLeader(history, players);
    const bob = result.find((r) => r.playerId === 'b')!;
    expect(bob.hanchansNeeded).toBeNull();
  });

  it('returns an empty array when fewer than two players have recorded hanchans', () => {
    expect(computeCatchUpToLeader([], players)).toEqual([]);
    expect(computeCatchUpToLeader(historyWithProfits([['a', 5, 1000]]), players)).toEqual([]);
  });
});
