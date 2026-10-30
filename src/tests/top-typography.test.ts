/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TILE_MENUS } from '../components/home/tiles/tileMenus';

const css = readFileSync('src/components/home/tiles/mahjongTiles.css', 'utf8');

describe('self-hosted TOP typeface', () => {
  it('ships a compact WOFF2 with its redistribution license', () => {
    const font = readFileSync('public/fonts/noto-serif-jp-700-top.woff2');
    expect(font.toString('ascii', 0, 4)).toBe('wOF2');
    expect(font.readUInt32BE(8)).toBe(font.length);
    expect(font.length).toBeLessThan(50_000);
    expect(readFileSync('public/fonts/OFL-Noto-Serif-JP.txt', 'utf8')).toContain('SIL OPEN FONT LICENSE Version 1.1');
    expect(css).toContain('url("/fonts/noto-serif-jp-700-top.woff2")');
  });
  it('covers every menu label in the subset declaration', () => {
    const range = css.match(/unicode-range:\s*([^;]+);/)![1];
    const ranges = range.split(',').map(entry => entry.trim().slice(2).split('-').map(value => parseInt(value, 16)));
    for (const menu of TILE_MENUS) for (const character of menu.name) {
      const code = character.codePointAt(0)!;
      expect(ranges.some(([start, end = start]) => code >= start && code <= end), `Missing TOP character: ${character}`).toBe(true);
    }
  });
  it('uses real bold with a scoped alias and visible loading fallback', () => {
    const face = css.match(/@font-face\s*{[^}]+}/)![0];
    expect(face).toContain('font-family: "Jankane TOP Mincho"');
    expect(face).toContain('font-weight: 700');
    expect(face).toContain('font-display: swap');
    const titleRule = css.match(/\.mahjong-home-menu \.jk-menu-title\s*{[^}]+}/)![0];
    expect(titleRule).toContain('font-weight:700');
    expect(titleRule).toContain('font-synthesis:none');
    expect(titleRule).toContain('"Yu Mincho",serif');
    expect(titleRule).not.toMatch(/font-size|position|transform/);
  });
});
