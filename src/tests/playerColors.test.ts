import { describe, expect, it } from 'vitest';
import { ensurePlayerColors, PLAYER_COLOR_PALETTE, pickPlayerColor } from '../lib/playerColors';

describe('pickPlayerColor', () => {
  it('returns the first palette color when nothing is used yet', () => {
    expect(pickPlayerColor([])).toBe(PLAYER_COLOR_PALETTE[0]);
  });

  it('skips colors already in use', () => {
    expect(pickPlayerColor([PLAYER_COLOR_PALETTE[0]])).toBe(PLAYER_COLOR_PALETTE[1]);
    expect(pickPlayerColor([PLAYER_COLOR_PALETTE[0], PLAYER_COLOR_PALETTE[1]])).toBe(PLAYER_COLOR_PALETTE[2]);
  });

  it('ignores undefined entries in the used list', () => {
    expect(pickPlayerColor([undefined, PLAYER_COLOR_PALETTE[0], undefined])).toBe(PLAYER_COLOR_PALETTE[1]);
  });

  it('falls back to a distinct generated color once the whole palette is taken', () => {
    const color = pickPlayerColor(PLAYER_COLOR_PALETTE);
    expect(PLAYER_COLOR_PALETTE).not.toContain(color);
    expect(color).toMatch(/^hsl\(/);
  });

  it('never returns a color already used, even past the palette', () => {
    const used = [...PLAYER_COLOR_PALETTE];
    for (let i = 0; i < 20; i++) {
      const color = pickPlayerColor(used);
      expect(used).not.toContain(color);
      used.push(color);
    }
  });
});

describe('ensurePlayerColors', () => {
  it('leaves players that already have a color untouched', () => {
    const players = [{ id: 'a', color: '#111111' }];
    expect(ensurePlayerColors(players)).toEqual(players);
  });

  it('backfills missing colors without colliding with existing ones', () => {
    const players: { id: string; color?: string }[] = [
      { id: 'a', color: PLAYER_COLOR_PALETTE[0] },
      { id: 'b' },
      { id: 'c' },
    ];
    const healed = ensurePlayerColors(players);
    const colors = healed.map((p) => p.color);
    expect(new Set(colors).size).toBe(3);
    expect(healed[0].color).toBe(PLAYER_COLOR_PALETTE[0]);
  });

  it('assigns every player a color when none have one', () => {
    const players: { id: string; color?: string }[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const healed = ensurePlayerColors(players);
    const colors = healed.map((p) => p.color);
    expect(colors.every((c) => !!c)).toBe(true);
    expect(new Set(colors).size).toBe(3);
  });
});
