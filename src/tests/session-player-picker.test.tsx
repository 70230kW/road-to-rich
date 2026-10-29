/// <reference types="node" />
import { act, cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MatchSessionPanel } from '../components/input/MatchSessionPanel';
import { defaultSettings, useAppStore } from '../store/useAppStore';
import type { Player } from '../types';

const players: Player[] = [
  { id: 'a', name: '佐野さん（最強）', color: '#38bdf8' },
  { id: 'b', name: '和賀', color: '#f87171' },
  { id: 'c', name: 'セーシロー', color: '#34d399' },
  { id: 'd', name: 'タカハシ', color: '#a78bfa' },
  { id: 'e', name: 'とても長い名前の雀士でも省略せずに表示する', color: '#fbbf24' },
];
const start = vi.fn<() => Promise<void>>();
const originalStart = useAppStore.getState().startSession;
beforeEach(() => {
  start.mockReset().mockResolvedValue(undefined);
  useAppStore.setState({ roomCode: 'picker-test', players, settings: { ...defaultSettings, playerCount: 4 }, currentDayGames: [], currentSession: null, startSession: start });
});
afterEach(() => { cleanup(); useAppStore.setState({ startSession: originalStart }); vi.restoreAllMocks(); });
const selectedCount = () => screen.getByRole('status').textContent;
const choose = (name: string) => fireEvent.click(screen.getByRole('checkbox', { name }));

describe('match session participant picker', () => {
  it('starts with an intentional empty selection, readable full names and an accurate remaining count', () => {
    render(<MatchSessionPanel onSettle={vi.fn()} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(5);
    screen.getAllByRole('checkbox').forEach(item => expect(item).not.toBeChecked());
    expect(selectedCount()).toContain('0人');
    expect(screen.getByRole('button', { name: '0人で対局会を開始' })).toBeDisabled();
    expect(screen.getByText('あと4人選択してください（4人麻雀）。')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: players[4].name })).toBeInTheDocument();
    choose('和賀');
    expect(selectedCount()).toContain('1人');
    expect(screen.getByText('あと3人選択してください（4人麻雀）。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '全員を選択' })).toBeEnabled();
  });

  it('searches Japanese width/kana variants without losing hidden selections', () => {
    render(<MatchSessionPanel onSettle={vi.fn()} />);
    choose('和賀');
    const search = screen.getByRole('searchbox', { name: '参加雀士を検索' });
    fireEvent.change(search, { target: { value: 'たかはし' } });
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    choose('タカハシ');
    expect(selectedCount()).toContain('2人');
    fireEvent.change(search, { target: { value: '(最強)' } });
    expect(screen.getByRole('checkbox', { name: players[0].name })).toBeInTheDocument();
    fireEvent.change(search, { target: { value: 'ｾｰｼﾛｰ' } });
    expect(screen.getByRole('checkbox', { name: 'セーシロー' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '検索をクリア' }));
    expect(search).toHaveFocus();
    expect(screen.getAllByRole('checkbox')).toHaveLength(5);
    expect(screen.getByRole('checkbox', { name: '和賀' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'タカハシ' })).toBeChecked();
  });

  it('reviews selected players, handles no results, and makes bulk actions explicitly roster-wide', () => {
    render(<MatchSessionPanel onSettle={vi.fn()} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '和賀' } });
    fireEvent.click(screen.getByRole('button', { name: '全員を選択' }));
    expect(selectedCount()).toContain('5人');
    expect(screen.getByRole('button', { name: '全員を選択' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '検索をクリア' }));
    fireEvent.click(screen.getByRole('button', { name: '選択済みのみ' }));
    choose('和賀');
    expect(screen.queryByRole('checkbox', { name: '和賀' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '存在しない雀士' } });
    expect(screen.getByText('条件に合う雀士が見つかりません。')).toBeInTheDocument();
    expect(selectedCount()).toContain('4人');
    fireEvent.click(screen.getByRole('button', { name: '選択をクリア' }));
    fireEvent.click(screen.getByRole('button', { name: '検索をクリア' }));
    expect(screen.getByText('まだ参加メンバーが選択されていません。')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'すべての雀士を表示' }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(5);
    expect(screen.getByRole('button', { name: '選択済みのみ' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('supports native keyboard checkbox activation and row labels', async () => {
    const user = userEvent.setup();
    render(<MatchSessionPanel onSettle={vi.fn()} />);
    const checkbox = screen.getByRole('checkbox', { name: '和賀' });
    checkbox.focus(); await user.keyboard('[Space]');
    expect(checkbox).toBeChecked();
    await user.click(screen.getByText('和賀'));
    expect(checkbox).not.toBeChecked();
  });

  it('validates four/three-player rules and title, and submits only the chosen IDs', async () => {
    render(<MatchSessionPanel onSettle={vi.fn()} />);
    ['和賀', 'セーシロー', 'タカハシ'].forEach(choose);
    expect(screen.getByRole('button', { name: '3人で対局会を開始' })).toBeDisabled();
    act(() => useAppStore.setState({ settings: { ...defaultSettings, playerCount: 3 } }));
    expect(screen.getByText('3人で開始できます（3人麻雀）。')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('対局会名'), { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: '3人で対局会を開始' })).toBeDisabled();
    expect(screen.getByText('対局会名を入力してください。')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('対局会名'), { target: { value: '金曜会' } });
    fireEvent.click(screen.getByRole('button', { name: '3人で対局会を開始' }));
    await waitFor(() => expect(start).toHaveBeenCalledExactlyOnceWith('金曜会', ['b', 'c', 'd']));
  });

  it('locks selection while saving and preserves it on a retryable error', async () => {
    let reject!: (error: Error) => void;
    start.mockImplementationOnce(() => new Promise<void>((_resolve, rejectPromise) => { reject = rejectPromise; }));
    render(<MatchSessionPanel onSettle={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '全員を選択' }));
    fireEvent.click(screen.getByRole('button', { name: '5人で対局会を開始' }));
    expect(screen.getByRole('button', { name: '開始中…' })).toBeDisabled();
    expect(screen.getByLabelText('対局会名')).toBeDisabled();
    expect(screen.getByRole('searchbox')).toBeDisabled();
    screen.getAllByRole('checkbox').forEach(item => expect(item).toBeDisabled());
    await act(async () => reject(new Error('offline')));
    expect(screen.getByRole('alert')).toHaveTextContent('対局会を開始できませんでした');
    screen.getAllByRole('checkbox').forEach(item => expect(item).toBeChecked());
    fireEvent.click(screen.getByRole('button', { name: '5人で対局会を開始' }));
    await waitFor(() => expect(start).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('handles an empty or asynchronously changing roster without counting removed players', () => {
    useAppStore.setState({ players: [] });
    render(<MatchSessionPanel onSettle={vi.fn()} />);
    expect(screen.getByText(/まだ雀士が登録されていません/)).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    act(() => useAppStore.setState({ players }));
    fireEvent.click(screen.getByRole('button', { name: '全員を選択' }));
    act(() => useAppStore.setState({ players: players.slice(0, 3) }));
    expect(selectedCount()).toContain('3人');
    expect(screen.getByRole('button', { name: '3人で対局会を開始' })).toBeDisabled();
    act(() => useAppStore.setState({ players: [...players.slice(0, 3), { id: 'new', name: '新規雀士', color: '#ffffff' }] }));
    expect(screen.getByRole('checkbox', { name: '新規雀士' })).not.toBeChecked();
  });

  it('leaves the existing live-session and clear-confirmation flow available', () => {
    useAppStore.setState({ currentSession: { id: 'session', title: '実施中の対局会', participantIds: ['a', 'b', 'c', 'd'], startedAt: '2026-10-30T00:00:00Z' } });
    render(<MatchSessionPanel onSettle={vi.fn()} />);
    expect(screen.getByRole('heading', { name: '実施中の対局会' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: '対局会の参加雀士' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '設定を解除' }));
    expect(within(screen.getByRole('dialog')).getByText('対局会設定を解除')).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'キャンセル' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useAppStore.getState().currentSession?.title).toBe('実施中の対局会');
  });

  it('uses full-width aligned rows, readable names and a bounded scrolling list', () => {
    const style = document.createElement('style');
    // JSDOM cannot resolve dvh inside min(); substitute this test viewport's pixels.
    // Real responsive layout remains a browser QA item, not a CSSOM guarantee.
    style.textContent = readFileSync('src/components/input/sessionPlayerPicker.css', 'utf8')
      .replace('52dvh', `${window.innerHeight * .52}px`);
    document.head.append(style);
    try {
      render(<MatchSessionPanel onSettle={vi.fn()} />);
      const row = screen.getByRole('checkbox', { name: players[4].name }).closest('label')!;
      expect(getComputedStyle(row).display).toBe('grid');
      expect(getComputedStyle(row).minHeight).toBe('56px');
      expect(getComputedStyle(screen.getByText(players[4].name)).overflowWrap).toBe('anywhere');
      expect(getComputedStyle(screen.getByRole('searchbox')).fontSize).toBe('16px');
      expect(getComputedStyle(row.parentElement!).overflowY).toBe('auto');
    } finally { style.remove(); }
  });
});
