import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildMatchReplay } from '../lib/matchReplay';
import { MatchReplay } from '../components/history/MatchReplay';
import { DayCard } from '../components/history/DayCard';
import { MatchResultSequence } from '../components/input/MatchResultSequence';
import { defaultSettings } from '../lib/defaults';
import type { DayRecord, Game } from '../types';

const players = ['a', 'b', 'c', 'd', 'e'].map(id => ({ id, name: id === 'a' ? '名前の長い雀士（テスト）' : `雀士${id}`, color: '#aaaaaa' }));
const game = (id: string, profits: Record<string, number>, raw = 25000): Game => ({ id, scores: Object.entries(profits).map(([playerId, point], index) => ({ playerId, point, rank: index + 1, rawScore: raw + point })) });
const day = (games: Game[], id = 'day', date = '2026-10-30T00:00:00Z'): DayRecord => ({ id, date, games, chips: {}, chipRate: 200, tableFee: 5000, settlement: {}, session: { id: 's', title: '金曜対局会', participantIds: players.map(p => p.id), startedAt: date } });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('recorded-result replay', () => {
  it('starts at zero, excludes future participants from ranks, handles ties and uses saved amounts', () => {
    const record = day([game('1', { a: 100, b: 100, c: -200 }), game('2', { a: -500, b: 0, d: 500 })]);
    const original = JSON.stringify(record);
    const frames = buildMatchReplay(record, players);
    expect(frames).toHaveLength(3);
    expect(frames[0].rows.every(row => row.rank === null && row.profit === 0)).toBe(true);
    expect(frames[1].rows.map(row => [row.id, row.rank])).toEqual([['a', 1], ['b', 1], ['c', 3], ['d', null]]);
    expect(frames[2].rows.map(row => [row.id, row.profit])).toEqual([['d', 500], ['b', 100], ['c', -200], ['a', -400]]);
    expect(frames[2].highlights).toContain('雀士dが単独首位に浮上');
    expect(frames[2].rows.find(row => row.id === 'c')).toMatchObject({ count: 1, delta: 0 });
    expect(JSON.stringify(record)).toBe(original);
  });
  it('does not use future records, the current day, or equal scores as a personal best', () => {
    const record = day([game('1', { a: 200 }), game('2', { a: 200 }), game('3', { a: 300 })]);
    const before = day([game('old', { a: 100 })], 'old', '2026-10-29T00:00:00Z');
    const future = day([game('future', { a: 90000 })], 'future', '2026-11-01T00:00:00Z');
    const frames = buildMatchReplay(record, players, [future, record, before]);
    expect(frames[1].highlights.join()).toContain('自己最高素点を更新（25,200点）');
    expect(frames[2].highlights).toEqual([]);
    expect(frames[3].highlights.join()).toContain('25,300点');
    expect(buildMatchReplay(record, [])[1].rows[0].name).toBe('退会した雀士');
    expect(buildMatchReplay(day([]), players)).toHaveLength(1);
  });
  it('supports buttons, keyboard, scrubber and resets for a different day', () => {
    const record = day([game('1', { a: 100, b: -100 }), { ...game('2', { a: -300, b: 300 }), note: '最後の逆転' }]);
    const view = render(<MatchReplay day={record} players={players} />);
    expect(screen.getByRole('button', { name: '前の半荘' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '次の半荘' }));
    expect(screen.getByRole('status')).toHaveTextContent('第1半荘終了');
    fireEvent.keyDown(screen.getByRole('group'), { key: 'ArrowRight' });
    expect(screen.getByRole('status')).toHaveTextContent('最終結果');
    expect(screen.getByText('最後の逆転')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '次の半荘' })).toBeDisabled();
    fireEvent.change(screen.getByRole('slider'), { target: { value: '0' } });
    expect(screen.getByRole('status')).toHaveTextContent('対局開始前');
    fireEvent.click(screen.getByRole('button', { name: '次の半荘' }));
    view.rerender(<MatchReplay day={day([game('x', { a: 0 })], 'new')} players={players} />);
    expect(screen.getByRole('slider')).toHaveValue('0');
  });
  it('accepts deliberate horizontal swipes, not taps, vertical gestures or canceled drags', () => {
    // JSDOM does not provide PointerEvent in this environment.
    class TestPointerEvent extends MouseEvent {
      pointerId: number; isPrimary: boolean;
      constructor(type: string, init: PointerEventInit) { super(type, init); this.pointerId = init.pointerId ?? 1; this.isPrimary = init.isPrimary ?? true; }
    }
    vi.stubGlobal('PointerEvent', TestPointerEvent);
    try {
      render(<MatchReplay day={day([game('1', { a: 1 }), game('2', { a: 2 })])} players={players} />);
      const stage = screen.getByRole('group');
      const swipe = (x: number, y: number) => { fireEvent.pointerDown(stage, { clientX: 200, clientY: 100, pointerId: 1 }); fireEvent.pointerUp(stage, { clientX: x, clientY: y, pointerId: 1 }); };
      swipe(190, 100); swipe(195, 250);
      expect(screen.getByRole('slider')).toHaveValue('0');
      swipe(80, 105);
      expect(screen.getByRole('slider')).toHaveValue('1');
      fireEvent.pointerDown(stage, { clientX: 200, clientY: 100 }); fireEvent.pointerCancel(stage); fireEvent.pointerUp(stage, { clientX: 20, clientY: 100 });
      expect(screen.getByRole('slider')).toHaveValue('1');
      swipe(300, 105);
      expect(screen.getByRole('slider')).toHaveValue('0');
    } finally { vi.unstubAllGlobals(); }
  });
  it('opens from existing history without invoking any write action', async () => {
    const update = vi.fn(), remove = vi.fn();
    const record = day([game('1', { a: 50 })]);
    record.settlement.a = { gamesTotal: 50, chipCount: 0, chipValue: 0, tableFeeShare: 0, totalWithoutFee: 50, totalWithFee: 50 };
    render(<DayCard day={record} players={players} settings={defaultSettings} isExpanded onToggle={vi.fn()} onUpdateDay={update} onDeleteDay={remove} />);
    fireEvent.click(screen.getByRole('button', { name: '対局会を振り返る' }));
    await screen.findByRole('heading', { name: '対局会を振り返る' });
    fireEvent.click(screen.getByRole('button', { name: '次の半荘' }));
    expect(update).not.toHaveBeenCalled(); expect(remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '振り返りを閉じる' }));
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });
  it('opens from the post-settlement result and still allows completion', async () => {
    const complete = vi.fn();
    render(<MatchResultSequence title="結果" resultDay={day([game('1', { a: 50 })])} historyBefore={[]} players={players} settings={defaultSettings} onComplete={complete} />);
    fireEvent.click(screen.getByRole('tab', { name: /振り返り/ }));
    expect(await within(screen.getByRole('tabpanel')).findByRole('slider')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'リーグホームへ' }));
    expect(complete).toHaveBeenCalledOnce();
  });
});
