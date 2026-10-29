import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MahjongTileMenu } from '../components/home/tiles/MahjongTileMenu';
import { menuIndex, nearestPosition, springStep, tilePose } from '../components/home/tiles/tileMotion';
import { TopSection } from '../components/home/TopSection';

let reduced = false;
beforeEach(() => {
  reduced = false;
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal('PointerEvent', class extends MouseEvent {
    pointerId: number; isPrimary: boolean; pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) { super(type, init); this.pointerId = init.pointerId ?? 1; this.isPrimary = init.isPrimary ?? true; this.pointerType = init.pointerType ?? 'mouse'; }
  });
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('continuous tile orbit', () => {
  it('is periodic over many turns with no position jump at either seam', () => {
    for (let p = -20; p <= 20; p += .125) for (let i = 0; i < 4; i++) {
      const pose = tilePose(i, p), next = tilePose(i, p + 4);
      for (const key of Object.keys(pose) as (keyof typeof pose)[]) expect(next[key]).toBeCloseTo(pose[key], 10);
      const near = tilePose(i, p + .00001);
      expect(Math.abs(near.x - pose.x)).toBeLessThan(.0001);
      expect(Math.abs(near.light - pose.light)).toBeLessThan(.0001);
    }
    expect(menuIndex(-1)).toBe(3); expect(menuIndex(4)).toBe(0); expect(menuIndex(101)).toBe(1);
  });
  it('dims continuously, never making a rear tile invisible', () => {
    let last = 1;
    for (let p = 0; p <= 2; p += .01) {
      const pose = tilePose(0, p);
      expect(pose.light).toBeLessThanOrEqual(last + 1e-10);
      expect(pose.light).toBeGreaterThan(0); last = pose.light;
    }
  });
  it('chooses the nearest copy for direct menu selection', () => {
    expect(nearestPosition(0, 3)).toBe(4); expect(nearestPosition(3, 0)).toBe(-1);
    expect(nearestPosition(1, 12.8)).toBe(13); expect(nearestPosition(3, -4.2)).toBe(-5);
  });
  it('uses elapsed time consistently and stays continuous on reversal', () => {
    const run = (hz: number) => { let s = { position: 3, velocity: 0 }; for (let i = 0; i < hz; i++) s = springStep(s.position, 4, s.velocity, 1 / hz); return s; };
    expect(run(15).position).toBeCloseTo(run(120).position, 10);
    expect(run(15).position).toBeCloseTo(4, 4);
    let s = springStep(3, 4, 0, .2);
    const before = s.position;
    s = springStep(s.position, 2, s.velocity, 1 / 120);
    expect(Math.abs(s.position - before)).toBeLessThan(.05);
    for (let i = 0; i < 120; i++) s = springStep(s.position, 2, s.velocity, 1 / 120);
    expect(s.position).toBeCloseTo(2, 4);
  });
});

describe('tile menu interaction and fallback', () => {
  it('selects in both directions, including several complete loops, without navigating', () => {
    const onOpen = vi.fn(), change = vi.fn();
    render(<MahjongTileMenu onOpen={onOpen} onSelectionChange={change} />);
    for (let i = 0; i < 12; i++) fireEvent.click(screen.getByRole('button', { name: '次のメニュー' }));
    expect(screen.getByRole('button', { name: '順位表を開く' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '前のメニュー' }));
    expect(screen.getByRole('button', { name: '段位を開く' })).toBeInTheDocument();
    expect(change).toHaveBeenLastCalledWith(3); expect(onOpen).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '段位を開く' }));
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('rank');
  });
  it('supports arrows, direct selection, Home/End and the native open button', () => {
    const onOpen = vi.fn(); render(<MahjongTileMenu onOpen={onOpen} />);
    const root = screen.getByRole('region', { name: '麻雀牌のホームメニュー' });
    fireEvent.keyDown(root, { key: 'ArrowLeft' }); expect(screen.getByRole('button', { name: '段位を開く' })).toBeInTheDocument();
    fireEvent.keyDown(root, { key: 'ArrowRight' }); expect(screen.getByRole('button', { name: '順位表を開く' })).toBeInTheDocument();
    fireEvent.keyDown(root, { key: 'End' }); fireEvent.keyDown(root, { key: 'Home' });
    for (const [name, id] of [['02 対局入力', 'input'], ['03 ダッシュボード', 'dashboard'], ['04 段位', 'rank'], ['01 順位表', 'ranking']]) {
      fireEvent.click(screen.getByRole('button', { name }));
      fireEvent.click(screen.getByRole('button', { name: name.slice(3) + 'を開く' }));
      expect(onOpen).toHaveBeenLastCalledWith(id);
    }
  });
  it('does not navigate after horizontal drag, synthetic click, vertical gesture or cancellation', () => {
    const onOpen = vi.fn(); const { container } = render(<MahjongTileMenu onOpen={onOpen} />);
    const stage = container.querySelector('.jk-stage')!;
    Object.assign(stage, { setPointerCapture: vi.fn(), hasPointerCapture: () => false });
    const tile = container.querySelector('.jk-fallback-tile')!;
    fireEvent.pointerDown(tile, { clientX: 200, clientY: 100 });
    fireEvent.pointerMove(stage, { clientX: 20, clientY: 100 });
    fireEvent.pointerUp(stage, { clientX: 20, clientY: 100 }); fireEvent.click(tile);
    expect(onOpen).not.toHaveBeenCalled();
    fireEvent.pointerDown(tile, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(stage, { clientX: 102, clientY: 160 });
    fireEvent.pointerUp(tile, { clientX: 102, clientY: 160 });
    fireEvent.pointerDown(tile, { clientX: 100, clientY: 100 });
    fireEvent.pointerCancel(tile, { clientX: 100, clientY: 100 });
    expect(onOpen).not.toHaveBeenCalled();
  });
  it('opens only the focused fallback tile on a deliberate tap', () => {
    const onOpen = vi.fn(); const { container } = render(<MahjongTileMenu onOpen={onOpen} />);
    const tiles = container.querySelectorAll('.jk-fallback-tile');
    for (const tile of [tiles[1], tiles[0]]) {
      fireEvent.pointerDown(tile, { clientX: 100, clientY: 100 });
      fireEvent.pointerUp(tile, { clientX: 100, clientY: 100 });
    }
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('ranking');
  });
  it('restores the provided menu, and remains usable with reduced motion and no WebGL', () => {
    reduced = true;
    const { container } = render(<MahjongTileMenu initialIndex={3} onOpen={vi.fn()} />);
    expect(container.querySelector('[data-renderer="fallback"]')).toBeInTheDocument();
    expect(container.querySelectorAll('.jk-fallback-tile img')).toHaveLength(4);
    fireEvent.click(screen.getByRole('button', { name: '次のメニュー' }));
    expect(screen.getByRole('button', { name: '順位表を開く' })).toBeInTheDocument();
    act(() => { const callback = vi.mocked(requestAnimationFrame).mock.calls.at(-1)![0]; callback(performance.now() + 16); });
    expect(container.querySelector('[data-position="4"]')).toBeInTheDocument();
  });
  it('stops scheduled frames and removes listeners on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<MahjongTileMenu onOpen={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '次のメニュー' })); unmount();
    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function));
  });
  it('connects the input tile to the existing match entry instead of a new route', () => {
    const match = vi.fn(), navigate = vi.fn();
    render(<TopSection onOpenMatch={match} onNavigate={navigate} menuIndex={1} />);
    fireEvent.click(screen.getByRole('button', { name: '対局入力を開く' }));
    expect(match).toHaveBeenCalledOnce(); expect(navigate).not.toHaveBeenCalled();
  });
});
