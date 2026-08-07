import { describe, expect, it } from 'vitest';
import { areYakumanCompatible, YAKUMAN_LIST } from '../lib/yakuman';

describe('areYakumanCompatible', () => {
  it('blocks the impossible combo called out by the user (字一色 + 国士無双)', () => {
    expect(areYakumanCompatible('tsuiisou', 'kokushi')).toBe(false);
  });

  it('blocks a yakuman from compounding with its own double-yakuman upgrade', () => {
    expect(areYakumanCompatible('suuankou', 'suuankou-tanki')).toBe(false);
    expect(areYakumanCompatible('kokushi', 'kokushi-13')).toBe(false);
    expect(areYakumanCompatible('chuuren', 'junsei-chuuren')).toBe(false);
  });

  it('blocks 天和/地和 from compounding with each other (dealer vs non-dealer)', () => {
    expect(areYakumanCompatible('tenho', 'chiho')).toBe(false);
  });

  it('blocks 小四喜/大四喜 from compounding with each other or with 大三元 (only 4 sets total)', () => {
    expect(areYakumanCompatible('shousuushii', 'daisuushii')).toBe(false);
    expect(areYakumanCompatible('daisangen', 'shousuushii')).toBe(false);
    expect(areYakumanCompatible('daisangen', 'daisuushii')).toBe(false);
  });

  it('allows well-known real compounds', () => {
    expect(areYakumanCompatible('daisangen', 'suuankou')).toBe(true);
    expect(areYakumanCompatible('tsuiisou', 'suuankou')).toBe(true);
    expect(areYakumanCompatible('tsuiisou', 'daisangen')).toBe(true);
    expect(areYakumanCompatible('tenho', 'kokushi')).toBe(true);
    expect(areYakumanCompatible('chiho', 'chinroutou')).toBe(true);
  });

  it('is symmetric for every pair in the canonical list', () => {
    for (const a of YAKUMAN_LIST) {
      for (const b of YAKUMAN_LIST) {
        expect(areYakumanCompatible(a.id, b.id)).toBe(areYakumanCompatible(b.id, a.id));
      }
    }
  });

  it('treats a yakuman as compatible with itself', () => {
    expect(areYakumanCompatible('daisangen', 'daisangen')).toBe(true);
  });
});
