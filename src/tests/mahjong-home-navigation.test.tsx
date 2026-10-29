import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from '../App';
import { useAppStore, defaultSettings } from '../store/useAppStore';
import type { Game } from '../types';

const addGame = vi.fn(async (_game: Omit<Game, 'id'>) => 'qa-saved');
beforeEach(() => {
  localStorage.clear(); localStorage.setItem('road-to-rich-welcome-v1', 'seen');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
  addGame.mockClear();
  useAppStore.setState({ roomCode: 'tile-test', connectionStatus: 'synced', players: ['a', 'b', 'c', 'd'].map(id => ({ id, name: '雀士' + id, color: '#cdb780' })),
    settings: defaultSettings, currentDayGames: [], history: [],
    currentSession: { id: 'session', title: '再開する対局会', participantIds: ['a', 'b', 'c', 'd'], startedAt: '2026-10-29T00:00:00Z' }, addGame,
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal'); Reflect.deleteProperty(HTMLDialogElement.prototype, 'close'); });
const home = () => fireEvent.click(screen.getByRole('button', { name: 'TOPに戻る' }));

describe('home integration with the real app shell', () => {
  it('shows only the tile section on TOP and restores the shell and scrolling on exit', async () => {
    const { unmount } = render(<AppShell />);
    await screen.findByRole('button', { name: '順位表を開く' });
    expect(screen.queryByLabelText('あなたの通算成績')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'TOPに戻る' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'リーグホームを見る' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'メニューを開く' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'メインナビゲーション' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Provided by/)).not.toBeInTheDocument();
    expect(document.body).toHaveClass('top-scroll-locked');
    expect(document.documentElement).toHaveClass('top-scroll-locked');
    fireEvent.click(screen.getByRole('button', { name: '順位表を開く' }));
    await screen.findByRole('heading', { name: '総合ランキング' });
    const bottom = within(screen.getByRole('navigation', { name: 'メインナビゲーション' }));
    expect(bottom.queryByRole('button', { name: 'TOP' })).not.toBeInTheDocument();
    expect(bottom.getAllByRole('button')).toHaveLength(5);
    expect(bottom.getAllByRole('button')[0]).toHaveAccessibleName('リーグホーム');
    expect(bottom.getByRole('button', { name: '順位表' })).toHaveAttribute('aria-current', 'page');
    expect(document.body).not.toHaveClass('top-scroll-locked');
    expect(document.documentElement).not.toHaveClass('top-scroll-locked');
    fireEvent.click(bottom.getByRole('button', { name: 'リーグホーム' }));
    expect(await screen.findByLabelText('あなたの通算成績')).toBeInTheDocument();
    expect(bottom.getByRole('button', { name: 'リーグホーム' })).toHaveAttribute('aria-current', 'page');
    expect(bottom.getByRole('button', { name: 'メニュー' })).not.toHaveClass('is-active');
    fireEvent.click(bottom.getByRole('button', { name: '対局を記録' }));
    const record = screen.getByRole('dialog');
    expect(record).toBeInTheDocument();
    fireEvent.click(within(record).getByRole('button', { name: /閉じる/ }));
    expect(screen.queryByRole('region', { name: '麻雀牌のホームメニュー' })).not.toBeInTheDocument();
    home();
    expect(await screen.findByRole('button', { name: '順位表を開く' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'メインナビゲーション' })).not.toBeInTheDocument();
    expect(document.body).toHaveClass('top-scroll-locked');
    unmount();
    expect(document.body).not.toHaveClass('top-scroll-locked');
    expect(document.documentElement).not.toHaveClass('top-scroll-locked');
  });
  it('does not cover TOP with first-visit guidance or pull-to-refresh', async () => {
    localStorage.removeItem('road-to-rich-welcome-v1');
    const refreshRoom = vi.fn();
    useAppStore.setState({ refreshRoom });
    render(<AppShell />);
    await screen.findByRole('button', { name: '順位表を開く' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.touchStart(window, { touches: [{ clientY: 0 }] });
    fireEvent.touchMove(window, { touches: [{ clientY: 200 }] });
    fireEvent.touchEnd(window, { touches: [] });
    expect(refreshRoom).not.toHaveBeenCalled();
  });
  it('opens all three existing read-only screens and restores the selected tile on returning home', async () => {
    render(<AppShell />);
    await screen.findByRole('button', { name: '順位表を開く' });
    for (const [selection, title] of [['01 順位表', '順位表'], ['03 ダッシュボード', 'ダッシュボード'], ['04 段位', '段位']]) {
      fireEvent.click(screen.getByRole('button', { name: selection }));
      fireEvent.click(screen.getByRole('button', { name: title + 'を開く' }));
      expect(screen.queryByRole('region', { name: '麻雀牌のホームメニュー' })).not.toBeInTheDocument();
      await screen.findByRole('heading', { name: title === '順位表' ? '総合ランキング' : title });
      home();
      expect(await screen.findByRole('button', { name: title + 'を開く' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: selection })).toHaveAttribute('aria-pressed', 'true');
    }
  });
  it('reopens the existing input draft with live ranks and saves through the existing action', async () => {
    localStorage.setItem('road-to-rich-hanchan-draft:tile-test', JSON.stringify({ playerCount: 4, selectedIds: ['a', 'b', 'c', 'd'], manualInputs: ['400', '300', '200'] }));
    render(<AppShell />);
    fireEvent.click(await screen.findByRole('button', { name: '02 対局入力' }));
    const open = screen.getByRole('button', { name: '対局入力を開く' });
    open.focus(); await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('heading', { name: '半荘成績入力' })).toBeInTheDocument();
    expect(screen.getByLabelText('席1の素点 (百点単位)')).toHaveValue(400);
    expect(screen.getByLabelText('入力中の暫定順位')).toHaveTextContent('雀士a');
    fireEvent.change(screen.getByLabelText('席1の素点 (百点単位)'), { target: { value: '450' } });
    home();
    fireEvent.click(await screen.findByRole('button', { name: '対局入力を開く' }));
    expect(await screen.findByLabelText('席1の素点 (百点単位)')).toHaveValue(450);
    fireEvent.click(screen.getByRole('button', { name: 'この半荘を記録する' }));
    expect(await screen.findByText('半荘を保存しました')).toBeInTheDocument();
    expect(addGame).toHaveBeenCalledOnce();
    expect(addGame.mock.calls[0][0].scores[0].rawScore).toBe(45000);
    expect(useAppStore.getState().currentSession?.title).toBe('再開する対局会');
  });
});
