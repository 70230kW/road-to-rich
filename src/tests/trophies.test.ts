import { describe, expect, it } from 'vitest';
import { computePlayerTrophies, TROPHY_LIST } from '../lib/trophies';
import type { DayRecord, Game, GameScore, Player, Settings } from '../types';

const players: Player[] = [
  { id: 'a', name: 'Alice' },
  { id: 'b', name: 'Bob' },
  { id: 'c', name: 'Carolina' },
  { id: 'd', name: 'Daisuke' },
];

const settings: Settings = {
  playerCount: 4,
  initialScore: 25000,
  divider: 10,
  rankPoints4: [30000, 10000, -10000, -30000],
  rankPoints3: [20000, 0, -20000],
};

let gid = 0;
function game(scores: [string, number][], yakumanIds?: Record<string, string[]>): Game {
  const sorted = [...scores].sort((a, b) => b[1] - a[1]);
  const gameScores: GameScore[] = sorted.map(([playerId, rawScore], idx) => ({
    playerId,
    rawScore,
    rank: idx + 1,
    point: (rawScore - settings.initialScore) / settings.divider,
  }));
  gid += 1;
  return {
    id: `g${gid}`,
    scores: gameScores,
    ...(yakumanIds
      ? {
          yakumanEvents: Object.entries(yakumanIds).map(([playerId, ids], i) => ({
            id: `y${gid}-${i}`,
            playerId,
            yakumanIds: ids,
          })),
        }
      : {}),
  };
}

let did = 0;
function day(date: string, games: Game[]): DayRecord {
  const participantIds = [...new Set(games.flatMap((g) => g.scores.map((s) => s.playerId)))];
  const settlement: DayRecord['settlement'] = {};
  participantIds.forEach((pid) => {
    const gamesTotal = games.reduce((sum, g) => sum + (g.scores.find((s) => s.playerId === pid)?.point ?? 0), 0);
    settlement[pid] = { gamesTotal, chipCount: 0, chipValue: 0, tableFeeShare: 0, totalWithoutFee: gamesTotal, totalWithFee: gamesTotal };
  });
  did += 1;
  return { id: `d${did}`, date, games, tableFee: 0, chips: {}, chipRate: 100, settlement };
}

const ID_SET = new Set(TROPHY_LIST.map((t) => t.id));

describe('TROPHY_LIST integrity', () => {
  it('has unique ids', () => {
    expect(ID_SET.size).toBe(TROPHY_LIST.length);
  });

  it('every trophy ever unlocked by computePlayerTrophies is a known id', () => {
    const history: DayRecord[] = [
      day('2026-01-01T00:00:00.000Z', [
        game([
          ['a', 40000],
          ['b', 30000],
          ['c', 20000],
          ['d', 10000],
        ]),
      ]),
    ];
    const result = computePlayerTrophies(history, players, settings);
    for (const ids of Object.values(result)) {
      for (const id of ids) expect(ID_SET.has(id)).toBe(true);
    }
  });

  it('returns an empty set for a player with no recorded games', () => {
    const result = computePlayerTrophies([], players, settings);
    expect(result.a).toEqual(new Set());
  });
});

describe('bronze: basic single-hanchan achievements', () => {
  it('unlocks rank-based bronze trophies from one hanchan', () => {
    const history: DayRecord[] = [
      day('2026-01-01T00:00:00.000Z', [
        game([
          ['a', 40000],
          ['b', 30000],
          ['c', 20000],
          ['d', 10000],
        ]),
      ]),
    ];
    const result = computePlayerTrophies(history, players, settings);
    expect(result.a.has('b01')).toBe(true); // まずは初トップ (rank 1)
    expect(result.a.has('b02')).toBe(true); // 連対達成
    expect(result.a.has('b03')).toBe(true); // ラス回避
    expect(result.a.has('b04')).toBe(true); // プラス収支 (40000 > 25000)
    expect(result.b.has('b07')).toBe(true); // 安定の2着
    expect(result.c.has('b08')).toBe(true); // 粘りの3着
    expect(result.d.has('b03')).toBe(false); // Daisuke was last place
    expect(result.d.has('b13')).toBe(false); // no prior hanchan to chase
  });

  it('unlocks リベンジ/都落ち from two consecutive hanchans', () => {
    const history: DayRecord[] = [
      day('2026-01-01T00:00:00.000Z', [
        game([
          ['a', 10000],
          ['b', 20000],
          ['c', 30000],
          ['d', 40000],
        ]),
        game([
          ['a', 40000],
          ['b', 30000],
          ['c', 20000],
          ['d', 10000],
        ]),
      ]),
    ];
    const result = computePlayerTrophies(history, players, settings);
    expect(result.a.has('b12')).toBe(true); // リベンジ: 4着→1着
    expect(result.d.has('b13')).toBe(true); // 都落ち: 1着→4着
  });
});

describe('day-session (試合) streaks', () => {
  it('detects 連勝街道 (2 consecutive day-sessions won by total pt)', () => {
    const winningDay = (date: string) =>
      day(date, [
        game([
          ['a', 60000],
          ['b', 20000],
          ['c', 10000],
          ['d', 10000],
        ]),
      ]);
    const history = [winningDay('2026-01-01T00:00:00.000Z'), winningDay('2026-01-02T00:00:00.000Z')];
    const result = computePlayerTrophies(history, players, settings);
    expect(result.a.has('s03')).toBe(true);
  });

  it('does not award a streak trophy when the streak is broken', () => {
    const winningDay = (date: string) =>
      day(date, [
        game([
          ['a', 60000],
          ['b', 20000],
          ['c', 10000],
          ['d', 10000],
        ]),
      ]);
    const losingDay = (date: string) =>
      day(date, [
        game([
          ['b', 60000],
          ['a', 20000],
          ['c', 10000],
          ['d', 10000],
        ]),
      ]);
    const history = [winningDay('2026-01-01T00:00:00.000Z'), losingDay('2026-01-02T00:00:00.000Z')];
    const result = computePlayerTrophies(history, players, settings);
    expect(result.a.has('s03')).toBe(false);
  });
});

describe('cumulative checkpoint trophies', () => {
  it('awards トップランカー once cumulative avg rank first reaches <=2.00 at 30+ hanchans', () => {
    // 30 hanchans, alternating rank 1 and rank 2 => avg rank 1.5, well under 2.00.
    const games: Game[] = [];
    for (let i = 0; i < 30; i++) {
      games.push(
        i % 2 === 0
          ? game([
              ['a', 40000],
              ['b', 30000],
              ['c', 20000],
              ['d', 10000],
            ])
          : game([
              ['b', 40000],
              ['a', 30000],
              ['c', 20000],
              ['d', 10000],
            ]),
      );
    }
    const history = [day('2026-01-01T00:00:00.000Z', games)];
    const result = computePlayerTrophies(history, players, settings);
    expect(result.a.has('g18')).toBe(true);
  });

  it('does not award トップランカー below the 30-hanchan minimum sample', () => {
    const games: Game[] = [];
    for (let i = 0; i < 10; i++) {
      games.push(
        game([
          ['a', 40000],
          ['b', 30000],
          ['c', 20000],
          ['d', 10000],
        ]),
      );
    }
    const history = [day('2026-01-01T00:00:00.000Z', games)];
    const result = computePlayerTrophies(history, players, settings);
    expect(result.a.has('g18')).toBe(false);
  });
});

describe('special: yakuman-based trophies', () => {
  it('unlocks the matching single-yakuman trophy and 役満の目撃者 for the whole table', () => {
    const history = [
      day('2026-01-01T00:00:00.000Z', [
        game(
          [
            ['a', 40000],
            ['b', 30000],
            ['c', 20000],
            ['d', 10000],
          ],
          { a: ['kokushi'] },
        ),
      ]),
    ];
    const result = computePlayerTrophies(history, players, settings);
    expect(result.a.has('sp01')).toBe(true); // 終焉を刻む十三針
    expect(result.b.has('b19')).toBe(true); // 役満の目撃者 (didn't win it themselves)
    expect(result.a.has('sp20')).toBe(true); // 伝説の幕開け (first yakuman ever)
  });

  it('detects compound (二重奏の神話) and triple-or-more (宇宙の崩壊) yakuman', () => {
    const history = [
      day('2026-01-01T00:00:00.000Z', [
        game(
          [
            ['a', 40000],
            ['b', 30000],
            ['c', 20000],
            ['d', 10000],
          ],
          { a: ['daisangen', 'tsuiisou'] },
        ),
      ]),
    ];
    const result = computePlayerTrophies(history, players, settings);
    expect(result.a.has('sp18')).toBe(true);
    expect(result.a.has('sp19')).toBe(false); // weight 1+1=2, not triple
  });

  it('魂を刈る死神: yakuman win in the same hanchan someone else busted', () => {
    const history = [
      day('2026-01-01T00:00:00.000Z', [
        game(
          [
            ['a', 60000],
            ['b', 20000],
            ['c', 15000],
            ['d', -5000],
          ],
          { a: ['suuankou'] },
        ),
      ]),
    ];
    const result = computePlayerTrophies(history, players, settings);
    expect(result.a.has('sp21')).toBe(true);
  });
});

describe('underground: tobi tiers', () => {
  it('counts cumulative tobi occurrences and buckets the raw-score range', () => {
    const history = [
      day('2026-01-01T00:00:00.000Z', [
        game([
          ['a', -3000],
          ['b', 40000],
          ['c', 30000],
          ['d', 33000],
        ]),
      ]),
    ];
    const result = computePlayerTrophies(history, players, settings);
    expect(result.a.has('u01')).toBe(true);
    expect(result.a.has('u02')).toBe(false);
    expect(result.a.has('u06')).toBe(true); // -5000 <= -3000 < 0
    expect(result.a.has('u07')).toBe(false);
  });
});

describe('impossible: table-wide and self-scoped patterns', () => {
  it('完全なる平和: awarded to every participant when all four land exactly on the origin', () => {
    const history = [
      day('2026-01-01T00:00:00.000Z', [
        game([
          ['a', 25000],
          ['b', 25000],
          ['c', 25000],
          ['d', 25000],
        ]),
      ]),
    ];
    const result = computePlayerTrophies(history, players, settings);
    expect(result.a.has('i01')).toBe(true);
    expect(result.b.has('i01')).toBe(true);
    expect(result.c.has('i01')).toBe(true);
    expect(result.d.has('i01')).toBe(true);
  });

  it('究極のトップタイ: only the 3 tied top scorers earn it, not the 4th player', () => {
    const history = [
      day('2026-01-01T00:00:00.000Z', [
        game([
          ['a', 33000],
          ['b', 33000],
          ['c', 33000],
          ['d', 1000],
        ]),
      ]),
    ];
    const result = computePlayerTrophies(history, players, settings);
    expect(result.a.has('i13')).toBe(true);
    expect(result.b.has('i13')).toBe(true);
    expect(result.c.has('i13')).toBe(true);
    expect(result.d.has('i13')).toBe(false);
  });

  it('エンジェルナンバー / ラッキーセブン: digit-pattern checks on own raw score', () => {
    const history = [
      day('2026-01-01T00:00:00.000Z', [
        game([
          ['a', 22200],
          ['b', 77700],
          ['c', 20100],
          ['d', 30000],
        ]),
      ]),
    ];
    const result = computePlayerTrophies(history, players, settings);
    expect(result.a.has('i09')).toBe(true); // 22200 repdigit
    expect(result.b.has('i15')).toBe(true); // 77700 composed of 7s and 0s
    expect(result.c.has('i09')).toBe(false);
  });

  it('歴史の反復: the same 4-score table recurring later in history is flagged for both hanchans', () => {
    const table: [string, number][] = [
      ['a', 41000],
      ['b', 29000],
      ['c', 19000],
      ['d', 11000],
    ];
    const history = [day('2026-01-01T00:00:00.000Z', [game(table)]), day('2026-02-01T00:00:00.000Z', [game(table)])];
    const result = computePlayerTrophies(history, players, settings);
    expect(result.a.has('i20')).toBe(true);
  });
});
