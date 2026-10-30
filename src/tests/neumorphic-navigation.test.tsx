import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AppShell } from '../App';
import { defaultSettings, useAppStore } from '../store/useAppStore';
import { calcDaySettlement, calcGameSettlement } from '../lib/calc';

beforeEach(() => {
  document.body.classList.add('neu-theme');
  localStorage.clear(); localStorage.setItem('road-to-rich-welcome-v1', 'seen');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
  const players = ['a', 'b', 'c', 'd'].map(id => ({ id, name: '雀士' + id, color: '#d9bd82' }));
  const games = [{ id: 'game', scores: calcGameSettlement(players.map((p,i) => ({ playerId: p.id, rawScore: [40000,30000,20000,10000][i] })), defaultSettings) }];
  const chips = Object.fromEntries(players.map(p => [p.id, 0]));
  useAppStore.setState({ roomCode: 'theme-test', connectionStatus: 'synced', players, settings: defaultSettings,
    currentSession: null, currentDayGames: games, history: [{ id: 'day', date: new Date().toISOString(), games, chips, chipRate: 200, tableFee: 4000, settlement: calcDaySettlement(games, chips, 4000, 200) }], refreshRoom: vi.fn(async () => {}) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); document.body.classList.remove('neu-theme'); Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal'); Reflect.deleteProperty(HTMLDialogElement.prototype, 'close'); });

it('reaches all 14 destinations with the shared theme and preserves TOP selection and record entry', async () => {
  render(<AppShell />);
  fireEvent.click(await screen.findByRole('button', { name: '順位表を開く' }));
  expect(await screen.findByRole('heading', { name: '総合ランキング' })).toBeInTheDocument();
  for (const [menu, heading] of [['リーグホーム', '今日も、一局ずつ。'], ['ダッシュボード', 'ダッシュボード'], ['対戦履歴', '対戦履歴'], ['段位', '段位'], ['成績予想', '成績予想'], ['実績', 'トロフィー'], ['シーズン', 'シーズン'], ['アプデ', 'アプデ'], ['ルール', 'ルール'], ['雀士登録', '雀士登録'], ['計算設定', '計算設定']]) {
    fireEvent.click(screen.getByRole('button', { name: 'メニューを開く' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'メニュー' })).getByRole('button', { name: menu }));
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    expect(document.body).toHaveClass('neu-theme');
    expect(document.body).not.toHaveClass('top-scroll-locked');
  }
  fireEvent.click(screen.getByRole('button', { name: 'TOPに戻る' }));
  expect(await screen.findByRole('button', { name: '順位表を開く' })).toBeInTheDocument();
  expect(document.body).toHaveClass('top-scroll-locked');
  fireEvent.click(screen.getByRole('button', { name: '02 対局入力' }));
  fireEvent.click(screen.getByRole('button', { name: '対局入力を開く' }));
  expect(await screen.findByRole('heading', { name: '半荘成績入力' })).toBeInTheDocument();
  expect(screen.getByLabelText('入力中の暫定順位')).toBeInTheDocument();
}, 20000);
