import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PodiumSpotlight, type PodiumEntry } from '../components/ranking/PodiumSpotlight';

const entries: PodiumEntry[] = [
  { id: 'a', name: 'タカハシ', place: 1, tier: '雀傑2', amount: '+95,680', amountLabel: null, positive: true, hanchanCount: 109 },
  { id: 'b', name: '佐野さん（最強）とても長い表示名', place: 2, tier: '雀傑2', amount: '+94,960', amountLabel: null, positive: true, hanchanCount: 174 },
  { id: 'c', name: '和賀', place: 3, tier: '雀傑1', amount: '+68,790', amountLabel: null, positive: true, hanchanCount: 66 },
];
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe('readable podium spotlight', () => {
  it('shows one large profile, cycles both ways and opens only on explicit confirmation', () => {
    const open = vi.fn(); render(<PodiumSpotlight entries={entries} onOpen={open} />);
    expect(screen.getByRole('heading', { name: 'タカハシ' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '前の雀士' }));
    expect(screen.getByRole('heading', { name: '和賀' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '次の雀士' }));
    fireEvent.click(within(screen.getByRole('group')).getByRole('button', { name: /2位/ }));
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
    vi.stubGlobal('PointerEvent', class extends MouseEvent { pointerId = 1; isPrimary = true; });
    const open = vi.fn(), { container } = render(<PodiumSpotlight entries={entries} onOpen={open} />);
    const area = container.querySelector('.podium-art')!;
    Object.assign(area, { setPointerCapture: vi.fn() });
    const swipe = (dx: number, dy: number, cancel = false) => {
      fireEvent.pointerDown(area, { clientX: 150, clientY: 100 });
      fireEvent.pointerMove(area, { clientX: 150 + dx, clientY: 100 + dy });
      if (cancel) fireEvent.pointerCancel(area); else fireEvent.pointerUp(area, { clientX: 150 + dx, clientY: 100 + dy });
    };
    swipe(-100, 2); expect(screen.getByRole('heading', { name: entries[1].name })).toBeInTheDocument();
    swipe(2, 100); swipe(-100, 0, true);
    expect(screen.getByRole('heading', { name: entries[1].name })).toBeInTheDocument();
    expect(open).not.toHaveBeenCalled();
  });
});
