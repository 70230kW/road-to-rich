import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PodiumSpotlight, type PodiumEntry } from '../components/ranking/PodiumSpotlight';
import { podiumOffset } from '../components/ranking/usePodiumCarousel';

const entries: PodiumEntry[] = [
  { id: 'a', name: 'タカハシ', place: 1, tier: '雀傑2', amount: '+95,680', amountLabel: null, positive: true, hanchanCount: 109, topRate: .33333, rentaiRate: .5, avgRank: 2.14 },
  { id: 'b', name: '佐野さん（最強）とても長い表示名', place: 2, tier: '雀傑2', amount: '+94,960', amountLabel: null, positive: true, hanchanCount: 174 },
  { id: 'c', name: '和賀', place: 3, tier: '雀傑1', amount: '+68,790', amountLabel: null, positive: true, hanchanCount: 66 },
];
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const reduceMotion = () => vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
describe('readable podium spotlight', () => {
  it('shows one large profile, cycles both ways and opens only on explicit confirmation', () => {
    const open = vi.fn(); render(<PodiumSpotlight entries={entries} onOpen={open} />);
    expect(screen.getByRole('heading', { name: 'タカハシ' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '前の雀士' }));
    expect(screen.getByRole('heading', { name: '和賀' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '次の雀士' }));
    fireEvent.click(within(screen.getByRole('group', { name: '表彰する雀士を選択' })).getByRole('button', { name: /2位/ }));
    expect(screen.getByRole('heading', { name: entries[1].name })).toBeInTheDocument();
    expect(open).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: `2位 ${entries[1].name}の成績詳細` }));
    expect(open).toHaveBeenCalledExactlyOnceWith('b');
  });
  it('keeps tied ranks, updates amounts, and falls back to the first player after filtering', () => {
    const ties = [entries[0], { ...entries[1], place: 1 }];
    const { rerender, container } = render(<PodiumSpotlight entries={ties} onOpen={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '次の雀士' }));
    expect(screen.getByRole('button', { name: `1位 ${entries[1].name}の成績詳細` })).toBeInTheDocument();
    expect(container.querySelector('.podium-feature')).toHaveAttribute('data-medal', 'gold');
    rerender(<PodiumSpotlight entries={[{ ...entries[0], amount: '-2,500', amountLabel: '2位との差', positive: false }]} onOpen={vi.fn()} />);
    expect(screen.getByRole('heading', { name: entries[0].name })).toBeInTheDocument();
    expect(screen.getByText('2位との差')).toBeInTheDocument();
    expect(container.querySelector('.podium-amount strong')).toHaveClass('profit-negative');
    expect(screen.queryByRole('button', { name: '次の雀士' })).not.toBeInTheDocument();
    rerender(<PodiumSpotlight entries={[]} onOpen={vi.fn()} />);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
  it('switches on horizontal swipe, ignores vertical scrolling and cancelled gestures', () => {
    reduceMotion();
    vi.stubGlobal('PointerEvent', class extends MouseEvent { pointerId = 1; isPrimary = true; });
    const open = vi.fn(), { container } = render(<PodiumSpotlight entries={entries} onOpen={open} />);
    const area = container.querySelector('.podium-viewport')!;
    Object.assign(area, { setPointerCapture: vi.fn() });
    Object.defineProperty(area, 'clientWidth', { value: 320 });
    const swipe = (dx: number, dy: number, cancel = false) => {
      fireEvent.pointerDown(area, { clientX: 150, clientY: 100 });
      fireEvent.pointerMove(area, { clientX: 150 + dx, clientY: 100 + dy });
      if (cancel) fireEvent.pointerCancel(area); else fireEvent.pointerUp(area, { clientX: 150 + dx, clientY: 100 + dy });
    };
    swipe(-100, 2); expect(screen.getByRole('heading', { name: entries[1].name })).toBeInTheDocument();
    swipe(2, 100); swipe(-100, 0, true);
    expect(screen.getByRole('heading', { name: entries[1].name })).toBeInTheDocument();
    expect(open).not.toHaveBeenCalled();
    // The pointer-generated click is suppressed, but keyboard activation remains usable.
    fireEvent.click(screen.getByRole('button', { name: `2位 ${entries[1].name}の成績詳細` }), { detail: 1 });
    expect(open).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: `2位 ${entries[1].name}の成績詳細` }), { detail: 0 });
    expect(open).toHaveBeenCalledExactlyOnceWith('b');
  });
  it('keeps readable statistics before the model, makes only the selected slide interactive, and supports keys', () => {
    reduceMotion();
    const { container } = render(<PodiumSpotlight entries={entries} onOpen={vi.fn()} />);
    const slide = screen.getByRole('article');
    expect(slide.firstElementChild).toHaveClass('podium-info');
    expect(slide.lastElementChild).toHaveClass('podium-art');
    expect(within(slide).getByText('33.3%')).toBeInTheDocument();
    expect(within(slide).getByText('50.0%')).toBeInTheDocument();
    expect(within(slide).getByText('2.14位')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-podium-slide][inert]')).toHaveLength(2);
    const area = container.querySelector('.podium-viewport')!;
    fireEvent.keyDown(area, { key: 'ArrowLeft' });
    expect(screen.getByRole('heading', { name: '和賀' })).toBeInTheDocument();
    fireEvent.keyDown(area, { key: 'ArrowRight' });
    expect(screen.getByRole('heading', { name: 'タカハシ' })).toBeInTheDocument();
  });
  it('follows the finger, animates to rest, reverses mid-flight and cancels its frame on unmount', () => {
    vi.stubGlobal('PointerEvent', class extends MouseEvent { pointerId = 1; isPrimary = true; });
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const frames = new Map<number, FrameRequestCallback>(); let sequence = 0, time = 0;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => { frames.set(++sequence, cb); return sequence; });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => { frames.delete(id); });
    const tick = () => act(() => { const pending = [...frames.values()]; frames.clear(); time += 16; pending.forEach(cb => cb(time)); });
    const { container, unmount } = render(<PodiumSpotlight entries={entries} onOpen={vi.fn()} />);
    const area = container.querySelector('.podium-viewport')!;
    Object.assign(area, { setPointerCapture: vi.fn() }); Object.defineProperty(area, 'clientWidth', { value: 320 });
    fireEvent.pointerDown(area, { clientX: 180, clientY: 100 });
    fireEvent.pointerMove(area, { clientX: 100, clientY: 100 });
    expect(container.querySelector('[data-podium-slide="0"]')).toHaveStyle({ transform: 'translate3d(-25%,0,0)' });
    fireEvent.pointerUp(area, { clientX: 100, clientY: 100 }); tick();
    fireEvent.click(screen.getByRole('button', { name: '前の雀士' }));
    for (let i = 0; i < 120; i++) tick();
    expect(container.querySelector('[data-podium-slide="0"]')).toHaveStyle({ transform: 'translate3d(0%,0,0)' });
    expect(frames.size).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: '次の雀士' }));
    expect(frames.size).toBeGreaterThan(0); unmount(); expect(frames.size).toBe(0);
  });
  it('moves continuously across both loop seams for multiple laps, including a two-player league', () => {
    for (const count of [2, 3]) for (let position = -12; position < 12; position += .031) for (let i = 0; i < count; i++) {
      const before = podiumOffset(i, position, count), after = podiumOffset(i, position + .001, count);
      if (Math.abs(before) < .99) expect(after - before).toBeCloseTo(-.001, 6);
    }
  });
});
