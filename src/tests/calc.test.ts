import { describe, expect, it } from 'vitest';
import {
  calcDaySettlement,
  calcGameSettlement,
  calcTableFeeShare,
  computeAutoLastScore,
  getExpectedScoreTotal,
  isChipTotalBalanced,
  parseHundredsInput,
  validateHanchanInput,
} from '../lib/calc';
import type { Game, Settings } from '../types';

const fourPlayerSettings: Settings = {
  playerCount: 4,
  initialScore: 25000,
  divider: 10,
  rankPoints4: [30000, 10000, -10000, -30000],
  rankPoints3: [20000, 0, -20000],
};

const threePlayerSettings: Settings = {
  ...fourPlayerSettings,
  playerCount: 3,
};

describe('getExpectedScoreTotal', () => {
  it('multiplies initial score by seat count', () => {
    expect(getExpectedScoreTotal(fourPlayerSettings)).toBe(100000);
    expect(getExpectedScoreTotal(threePlayerSettings)).toBe(75000);
  });
});

describe('computeAutoLastScore', () => {
  it('returns null until every other seat is filled', () => {
    expect(computeAutoLastScore([58200, null, 20000], fourPlayerSettings)).toBeNull();
  });

  it('back-solves the last seat from the remaining total', () => {
    // 100000 total - (58200 + 20000 + 15000) = 6800
    expect(computeAutoLastScore([58200, 20000, 15000], fourPlayerSettings)).toBe(6800);
  });

  it('works for three-player tables', () => {
    // 75000 total - (40000 + 20000) = 15000
    expect(computeAutoLastScore([40000, 20000], threePlayerSettings)).toBe(15000);
  });

  it('allows negative auto-computed scores (someone busted)', () => {
    expect(computeAutoLastScore([60000, 50000, -5000], fourPlayerSettings)).toBe(-5000);
  });
});

describe('calcGameSettlement', () => {
  it('matches the worked example from the spec exactly', () => {
    // 58,200 for 1st place, 25,000 return, divider 10 -> 6,320 yen
    const result = calcGameSettlement(
      [
        { playerId: 'a', rawScore: 58200 },
        { playerId: 'b', rawScore: 20000 },
        { playerId: 'c', rawScore: 15000 },
        { playerId: 'd', rawScore: 6800 },
      ],
      fourPlayerSettings,
    );
    const first = result.find((r) => r.playerId === 'a')!;
    expect(first.rank).toBe(1);
    expect(first.point).toBe(6320);
  });

  it('is zero-sum when rank points sum to zero', () => {
    const result = calcGameSettlement(
      [
        { playerId: 'a', rawScore: 12000 },
        { playerId: 'b', rawScore: 34000 },
        { playerId: 'c', rawScore: 28000 },
        { playerId: 'd', rawScore: 26000 },
      ],
      fourPlayerSettings,
    );
    const total = result.reduce((sum, r) => sum + r.point, 0);
    expect(total).toBeCloseTo(0, 9);
  });

  it('assigns ranks 1-4 in descending score order', () => {
    const result = calcGameSettlement(
      [
        { playerId: 'a', rawScore: 12000 },
        { playerId: 'b', rawScore: 34000 },
        { playerId: 'c', rawScore: 28000 },
        { playerId: 'd', rawScore: 26000 },
      ],
      fourPlayerSettings,
    );
    const byRank = [...result].sort((x, y) => x.rank - y.rank);
    expect(byRank.map((r) => r.playerId)).toEqual(['b', 'c', 'd', 'a']);
  });

  it('keeps original relative order for tied scores (stable sort)', () => {
    const result = calcGameSettlement(
      [
        { playerId: 'a', rawScore: 25000 },
        { playerId: 'b', rawScore: 25000 },
        { playerId: 'c', rawScore: 25000 },
      ],
      threePlayerSettings,
    );
    expect(result.map((r) => r.playerId)).toEqual(['a', 'b', 'c']);
    expect(result.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('supports three-player tables with their own rank points', () => {
    const result = calcGameSettlement(
      [
        { playerId: 'a', rawScore: 45000 },
        { playerId: 'b', rawScore: 20000 },
        { playerId: 'c', rawScore: 10000 },
      ],
      threePlayerSettings,
    );
    const first = result.find((r) => r.playerId === 'a')!;
    // (45000 + 20000 - 25000) / 10 = 4000
    expect(first.point).toBe(4000);
  });
});

describe('validateHanchanInput', () => {
  it('flags missing player selections', () => {
    const v = validateHanchanInput(['a', null, 'c', 'd'], [1, 2, 3, 4], fourPlayerSettings);
    expect(v.isValid).toBe(false);
    expect(v.missingPlayerIndices.has(1)).toBe(true);
  });

  it('flags duplicate player selections', () => {
    const v = validateHanchanInput(['a', 'b', 'a', 'd'], [1, 2, 3, 4], fourPlayerSettings);
    expect(v.isValid).toBe(false);
    expect(v.duplicatePlayerIds.has('a')).toBe(true);
  });

  it('flags missing scores', () => {
    const v = validateHanchanInput(['a', 'b', 'c', 'd'], [1, null, 3, 4], fourPlayerSettings);
    expect(v.isValid).toBe(false);
    expect(v.missingScoreIndices.has(1)).toBe(true);
  });

  it('flags a total that does not match the expected score total', () => {
    const v = validateHanchanInput(
      ['a', 'b', 'c', 'd'],
      [58200, 20000, 15000, 6801],
      fourPlayerSettings,
    );
    expect(v.isValid).toBe(false);
    expect(v.totalMismatch).toBe(true);
  });

  it('passes for a fully valid, balanced hanchan', () => {
    const v = validateHanchanInput(
      ['a', 'b', 'c', 'd'],
      [58200, 20000, 15000, 6800],
      fourPlayerSettings,
    );
    expect(v.isValid).toBe(true);
    expect(v.message).toBeNull();
  });
});

describe('calcTableFeeShare', () => {
  it('splits evenly with no remainder', () => {
    expect(calcTableFeeShare(4000, 4)).toBe(1000);
  });

  it('rounds up (切り上げ) when there is a remainder', () => {
    expect(calcTableFeeShare(4000, 3)).toBe(1334);
  });

  it('returns 0 for no participants', () => {
    expect(calcTableFeeShare(4000, 0)).toBe(0);
  });
});

describe('isChipTotalBalanced', () => {
  it('is true when the signed chip counts net to zero', () => {
    expect(isChipTotalBalanced({ a: 3, b: -1, c: -2 })).toBe(true);
  });

  it('is false otherwise', () => {
    expect(isChipTotalBalanced({ a: 3, b: -1, c: -1 })).toBe(false);
  });

  it('treats missing/empty values as zero', () => {
    expect(isChipTotalBalanced({ a: 0, b: 0 })).toBe(true);
  });
});

describe('parseHundredsInput', () => {
  it('scales a "百点" entry up to a raw score', () => {
    expect(parseHundredsInput('582')).toBe(58200);
  });

  it('returns null for blank input', () => {
    expect(parseHundredsInput('')).toBeNull();
    expect(parseHundredsInput('   ')).toBeNull();
  });

  it('returns null for non-numeric input', () => {
    expect(parseHundredsInput('-')).toBeNull();
    expect(parseHundredsInput('abc')).toBeNull();
  });

  it('supports negative scores', () => {
    expect(parseHundredsInput('-50')).toBe(-5000);
  });
});

describe('calcDaySettlement', () => {
  const games: Game[] = [
    {
      id: 'g1',
      scores: [
        { playerId: 'a', rawScore: 58200, rank: 1, point: 6320 },
        { playerId: 'b', rawScore: 20000, rank: 2, point: 500 },
        { playerId: 'c', rawScore: 15000, rank: 3, point: -1500 },
        { playerId: 'd', rawScore: 6800, rank: 4, point: -5320 },
      ],
    },
  ];

  it('combines game totals, chips, and the fee share per the spec formula', () => {
    const settlement = calcDaySettlement(games, { a: 1, b: -1, c: 0, d: 0 }, 4000, 100);
    // a: 6320 (games) + 100 (1 chip * 100) - 1000 (fee share) = 5420
    expect(settlement.a.totalWithoutFee).toBe(6420);
    expect(settlement.a.tableFeeShare).toBe(1000);
    expect(settlement.a.totalWithFee).toBe(5420);

    // b: 500 - 100 - 1000 = -600
    expect(settlement.b.totalWithFee).toBe(-600);
  });

  it('only includes participants supplied via the chips map', () => {
    const settlement = calcDaySettlement(games, { a: 0, b: 0 }, 0, 100);
    expect(Object.keys(settlement)).toEqual(['a', 'b']);
  });

  it('uses the day-specific chip rate rather than any fixed value', () => {
    const settlement = calcDaySettlement(games, { a: 2, b: -2, c: 0, d: 0 }, 0, 500);
    expect(settlement.a.chipValue).toBe(1000);
    expect(settlement.b.chipValue).toBe(-1000);
  });
});
