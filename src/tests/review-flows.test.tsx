import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InputSection } from '../components/input/InputSection';
import { DashboardSection } from '../components/dashboard/DashboardSection';
import { LeagueHomeSection } from '../components/home/LeagueHomeSection';
import { HistorySection } from '../components/history/HistorySection';
import { RankSection } from '../components/rank/RankSection';
import { RankingSection } from '../components/ranking/RankingSection';
import { RecordSheet } from '../components/layout/RecordSheet';
import { defaultSettings, useAppStore } from '../store/useAppStore';
import { useViewPreferences } from '../store/useViewPreferences';
import { calcDaySettlement, calcGameSettlement } from '../lib/calc';
import type { DayRecord } from '../types';

const players = ['a', 'b', 'c', 'd', 'e'].map(id => ({ id, name: `雀士${id}`, color: '#cdb780' }));
function day(id: string, date: string, ids = ['a', 'b', 'c', 'd']): DayRecord {
  const games = [{ id: `${id}-game`, scores: calcGameSettlement(ids.map((playerId, index) => ({ playerId, rawScore: [40000, 30000, 20000, 10000][index] })), defaultSettings) }];
  const chips = Object.fromEntries(ids.map(id => [id, 0]));
  return { id, date, games, chips, chipRate: 200, tableFee: 4000, settlement: calcDaySettlement(games, chips, 4000, 200), session: { id, title: `${id}対局会`, participantIds: ids, startedAt: date } };
}
const firstDay = day('朝', '2026-09-10T09:00:00+09:00');
beforeEach(() => {
  localStorage.clear();
  useViewPreferences.setState({ rooms: {} });
  useAppStore.setState({ roomCode: 'review', players, settings: defaultSettings, history: [firstDay], currentDayGames: [], currentSession: null, goals: {} });
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal'); Reflect.deleteProperty(HTMLDialogElement.prototype, 'close'); Reflect.deleteProperty(Element.prototype, 'scrollIntoView'); });

describe('separate input destinations', () => {
  it('offers three explicit choices and disables settlement before a game exists', () => {
    const onSelect = vi.fn();
    render(<RecordSheet gameCount={0} onSelect={onSelect} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: '対局入力' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /1半荘だけ記録/ }));
    expect(onSelect).toHaveBeenLastCalledWith('single');
    fireEvent.click(screen.getByRole('button', { name: /対局会を開始/ }));
    expect(onSelect).toHaveBeenLastCalledWith('session');
    expect(screen.getByRole('button', { name: /本日の精算/ })).toBeDisabled();
  });
  it('opens the single form without session setup and retains its draft across mode changes', () => {
    const { container } = render(<InputSection onNavigateToPlayers={vi.fn()} onResultComplete={vi.fn()} />);
    expect(screen.getByRole('heading', { name: '半荘成績入力' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: '対局会名' })).not.toBeInTheDocument();
    expect(container.querySelector('.hanchan-form .score-save-bar')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('入力1の素点 (百点単位)'), { target: { value: '425' } });
    fireEvent.click(screen.getByRole('button', { name: '対局会を開始' }));
    expect(screen.getByRole('textbox', { name: '対局会名' })).toBeInTheDocument();
    expect(container.querySelector('.score-save-bar')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '半荘成績入力' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '1半荘だけ記録' }));
    expect(screen.getByLabelText('入力1の素点 (百点単位)')).toHaveValue(425);
    expect(useAppStore.getState().currentSession).toBeNull();
  });
  it('starts a session through the existing action, then shows scores and live ranks', async () => {
    const startSession = vi.fn(async (title: string, participantIds: string[]) => {
      useAppStore.setState({ currentSession: { id: 'session', title, participantIds, startedAt: new Date().toISOString() } });
    });
    useAppStore.setState({ startSession });
    render(<InputSection initialMode="session" onNavigateToPlayers={vi.fn()} onResultComplete={vi.fn()} />);
    fireEvent.change(screen.getByRole('textbox', { name: '対局会名' }), { target: { value: '金曜夜' } });
    for (const player of players.slice(0, 4)) fireEvent.click(screen.getByRole('checkbox', { name: player.name }));
    fireEvent.click(screen.getByRole('button', { name: '4人で対局会を開始' }));
    expect(await screen.findByRole('heading', { name: '半荘成績入力' })).toBeInTheDocument();
    expect(startSession).toHaveBeenCalledExactlyOnceWith('金曜夜', ['a', 'b', 'c', 'd']);
    expect(screen.getByLabelText('入力中の暫定順位')).toBeInTheDocument();
    expect(screen.getByText(/「金曜夜」に記録します/)).toBeInTheDocument();
  });
  it('shows settlement only when requested, without saving on entry or cancel', () => {
    const finalizeDay = vi.fn();
    useAppStore.setState({ currentDayGames: firstDay.games, finalizeDay });
    const { container } = render(<InputSection onNavigateToPlayers={vi.fn()} onResultComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /本日の精算/ }));
    expect(container.querySelector('.hanchan-form')).not.toBeInTheDocument();
    expect(finalizeDay).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /戻る/ }));
    expect(screen.getByRole('heading', { name: '半荘成績入力' })).toBeInTheDocument();
    expect(useAppStore.getState().currentDayGames).toEqual(firstDay.games);
    expect(finalizeDay).not.toHaveBeenCalled();
  });
});

describe('clear performance scopes and history', () => {
  it('separates personal and league views, labels lifetime rank and offers recovery for empty periods', async () => {
    useViewPreferences.getState().update('review', { period: 'custom', customSeason: { year: 2025, month: 'all' } });
    const { container } = render(<DashboardSection />);
    expect(screen.getByText('この期間の成績はありません')).toBeInTheDocument();
    expect(container.querySelector('.rank-progress-card')).not.toBeInTheDocument();
    expect(screen.getByText(/通算段位：/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '通算を見る' }));
    expect(container.querySelector('.rank-progress-card')).toHaveTextContent('通算段位');
    expect(container.querySelector('.rank-progress-card')).toHaveTextContent('期間フィルターの対象外');
    fireEvent.click(screen.getByRole('button', { name: 'リーグ全体' }));
    expect(await screen.findByRole('heading', { name: 'リーグ全体の分析' }, { timeout: 5000 })).toBeInTheDocument();
    expect(container.querySelector('.player-career-card')).not.toBeInTheDocument();
    expect(screen.getByText('通算の実績・目標と今月のハイライト')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '個人成績' }));
    expect(container.querySelector('.player-career-card')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'リーグ全体の分析' })).not.toBeInTheDocument();
    expect(useAppStore.getState().history).toEqual([firstDay]);
  });
  it('filters participation before taking the latest three records on home', () => {
    useAppStore.setState({ history: [firstDay, ...[11, 12, 13].map(n => day(`夜${n}`, `2026-09-${n}T12:00:00Z`, ['b', 'c', 'd', 'e']))] });
    render(<LeagueHomeSection onOpenRecord={vi.fn()} onOpenMatch={vi.fn()} onNavigate={vi.fn()} />);
    const recent = within(screen.getByRole('region', { name: '最近の対局' }));
    expect(recent.getByText('朝対局会')).toBeInTheDocument();
    expect(recent.queryByText('不参加')).not.toBeInTheDocument();
    fireEvent.click(recent.getByRole('button', { name: 'リーグ全体' }));
    expect(recent.queryByText('朝対局会')).not.toBeInTheDocument();
    expect(recent.getAllByText('不参加')).toHaveLength(3);
    fireEvent.click(recent.getByRole('button', { name: '自分の対局' }));
    act(() => useViewPreferences.getState().update('review', { playerId: 'e' }));
    expect(recent.queryByText('朝対局会')).not.toBeInTheDocument();
    expect(recent.getByText('夜13対局会')).toBeInTheDocument();
  });
  it('distinguishes same-day sessions before expansion and filters pending entries by participant', () => {
    const evening = day('夜', '2026-09-10T20:00:00+09:00', ['b', 'c', 'd', 'e']);
    useAppStore.setState({ history: [firstDay, evening], currentDayGames: evening.games, currentSession: { ...evening.session!, title: '進行中の卓' } });
    render(<HistorySection />);
    const morning = screen.getByRole('button', { name: /朝対局会/ });
    expect(morning).toHaveAttribute('aria-expanded', 'false');
    expect(morning).toHaveTextContent('雀士a、雀士b、雀士c、雀士d');
    expect(morning).toHaveTextContent('精算済み');
    expect(screen.getByRole('button', { name: /夜対局会/ })).toHaveTextContent('雀士b、雀士c、雀士d');
    expect(screen.getByText('進行中の卓')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: '参加雀士' }), { target: { value: 'a' } });
    expect(screen.queryByText('進行中の卓')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /夜対局会/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /朝対局会/ })).toBeInTheDocument();
  });
});

describe('ranking priority and rank ladder', () => {
  it('keeps the list before the target and does not mount 3D until requested', () => {
    const { container } = render(<RankingSection />);
    expect(screen.getByRole('button', { name: '3D表彰台を見る（上位3人）' })).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('#ranking-podium')).not.toBeInTheDocument();
    expect(container.querySelector('.leaderboard-list')!.compareDocumentPosition(container.querySelector('.ranking-target')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '差額' }));
    expect(screen.getAllByText(/位との差/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: '詳細' }));
    expect(container.querySelector('.leaderboard-list')).toHaveClass('is-detail');
  });
  it('expands the current group after every player change and shows the next gap once per tier', () => {
    useAppStore.setState({ history: [{ ...firstDay, settlement: { ...firstDay.settlement,
      a: { ...firstDay.settlement.a, totalWithoutFee: 70000 }, b: { ...firstDay.settlement.b, totalWithoutFee: 170000 } } }] });
    const { container } = render(<RankSection />);
    expect(screen.getByRole('button', { name: '雀傑の内訳を閉じる' })).toHaveAttribute('aria-expanded', 'true');
    const ladder = within(container.querySelector('#rank-tier-list') as HTMLElement);
    expect(ladder.getByText('雀傑2まであと ¥20,000')).toBeInTheDocument();
    expect(ladder.getByText('収支 +300,000 以上')).toBeInTheDocument();
    expect(ladder.queryByRole('button', { name: /魂天の内訳/ })).not.toBeInTheDocument();
    expect(container.querySelector('.rank-tier-row[aria-current="true"]')).toHaveTextContent('雀傑1');
    fireEvent.click(screen.getByRole('button', { name: '雀傑の内訳を閉じる' }));
    act(() => useViewPreferences.getState().update('review', { playerId: 'b' }));
    expect(screen.getByRole('button', { name: '雀豪の内訳を閉じる' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: '雀傑の内訳を開く' })).toHaveAttribute('aria-expanded', 'false');
    act(() => useViewPreferences.getState().update('review', { playerId: 'a' }));
    expect(screen.getByRole('button', { name: '雀傑の内訳を閉じる' })).toHaveAttribute('aria-expanded', 'true');
  });
});
