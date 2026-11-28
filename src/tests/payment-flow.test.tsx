import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettlementForm } from '../components/input/SettlementForm';
import { PaymentHistory } from '../components/history/PaymentHistory';
import { calcDaySettlement } from '../lib/calc';
import { appendRepayment, defaultCashInputs, paymentFromInputs } from '../lib/payments';
import { useAppStore } from '../store/useAppStore';
import type { DayRecord, Game, Repayment } from '../types';
const players = ['a','b','c','d'].map(id => ({ id, name: id.toUpperCase(), color: '#aaa' }));
const games: Game[] = [{ id: 'hand', scores: [-20000,-5000,15000,10000].map((point, i) => ({ playerId: players[i].id, point, rawScore: 25000, rank: i + 1 })) }];
const chips = { a: 0, b: 0, c: 0, d: 0 };
const settlement = calcDaySettlement(games, chips, 0, 200);
const form = (save = vi.fn(async (_day: Omit<DayRecord, 'id' | 'date'>) => {})) => render(<SettlementForm players={players} currentDayGames={games} onSave={save} onCancel={vi.fn()} />);
function change(label: string, value: string) { fireEvent.change(screen.getByRole('textbox', { name: label }), { target: { value } }); }
function openAdvance() { fireEvent.click(screen.getByRole('button', { name: '払えない人がいた場合' })); }
async function confirmSave() { fireEvent.click(screen.getByRole('button', { name: 'この支払い内容で精算を保存' })); fireEvent.click(screen.getByRole('button', { name: '精算を保存' })); }
beforeEach(() => { Element.prototype.scrollIntoView = vi.fn(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); Reflect.deleteProperty(Element.prototype, 'scrollIntoView'); });

describe('optional advance settlement flow', () => {
  it('keeps ordinary settlement unchanged unless the extra screen is opened', async () => {
    const save = vi.fn(async (_day: Omit<DayRecord, 'id' | 'date'>) => {}); form(save);
    expect(screen.queryByRole('textbox', { name: 'Aの今日支払った額' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '結果を保存する' }));
    fireEvent.click(screen.getByRole('button', { name: '精算を保存' }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0]).toEqual({ games, chips, tableFee: 0, chipRate: 200, settlement });
  });
  it('blocks unbalanced cash, preserves edits on Back and saves repayment relationships with unchanged results', async () => {
    const save = vi.fn(async (_day: Omit<DayRecord, 'id' | 'date'>) => {}); form(save); openAdvance();
    expect(screen.getByRole('heading', { name: '立て替えを含めて精算' })).toHaveFocus();
    change('Aの今日支払った額', '5000');
    expect(screen.getByRole('alert')).toHaveTextContent('15,000円不足');
    expect(screen.getByRole('button', { name: 'この支払い内容で精算を保存' })).toBeDisabled();
    change('Bの今日支払った額', '20000');
    expect(screen.getByRole('region', { name: '後日返すお金' })).toHaveTextContent('A');
    expect(screen.getByRole('region', { name: '後日返すお金' })).toHaveTextContent('B');
    fireEvent.click(screen.getByRole('button', { name: '精算内容に戻る' }));
    expect(screen.getByText(/返済待ち 15,000円/)).toBeInTheDocument();
    openAdvance(); expect(screen.getByRole('textbox', { name: 'Aの今日支払った額' })).toHaveValue('5000');
    await confirmSave(); await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0]).toMatchObject({ settlement, payment: { version: 1, cash: { a: { paid: 5000, received: 0 }, b: { paid: 20000, received: 0 } }, repayments: [] } });
  });
  it('allows winners to defer receipts and keeps inputs after failed saves', async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined); form(save); openAdvance();
    change('Aの今日支払った額', '5000'); change('Cの今日受け取った額', '0');
    await confirmSave(); await screen.findByRole('alert');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Cの今日受け取った額' })).toHaveValue('0');
    await confirmSave(); await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    expect(save.mock.calls[0][0]).toEqual(save.mock.calls[1][0]);
  });
  it('does not submit twice or allow leaving the confirmation while saving', async () => {
    let resolve!: () => void;
    const save = vi.fn(() => new Promise<void>(r => { resolve = r; })); form(save); openAdvance();
    change('Aの今日支払った額', '5000'); change('Cの今日受け取った額', '0');
    await confirmSave();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled();
    fireEvent.keyDown(document, { key: 'Escape' }); expect(dialog).toBeInTheDocument();
    expect(save).toHaveBeenCalledOnce();
    await act(async () => resolve());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('can discard an optional payment draft and return to the regular flow', async () => {
    const save = vi.fn(async (_day: Omit<DayRecord, 'id' | 'date'>) => {}); form(save); openAdvance(); change('Aの今日支払った額', '0');
    fireEvent.click(screen.getByRole('button', { name: '精算内容に戻る' }));
    fireEvent.click(screen.getByRole('button', { name: '通常の精算に戻す' }));
    fireEvent.click(screen.getByRole('button', { name: '結果を保存する' }));
    fireEvent.click(screen.getByRole('button', { name: '精算を保存' }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0]).not.toHaveProperty('payment');
  });
  it('confirms before the local Back action can discard payment input', () => {
    const onCancel = vi.fn();
    render(<SettlementForm players={players} currentDayGames={games} onSave={vi.fn()} onCancel={onCancel} />);
    openAdvance(); change('Aの今日支払った額', '5000');
    fireEvent.click(screen.getByRole('button', { name: '精算内容に戻る' }));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    fireEvent.click(screen.getByRole('button', { name: '戻る' }));
    expect(confirm).toHaveBeenCalled(); expect(onCancel).not.toHaveBeenCalled();
    openAdvance(); expect(screen.getByRole('textbox', { name: 'Aの今日支払った額' })).toHaveValue('5000');
    fireEvent.click(screen.getByRole('button', { name: '精算内容に戻る' }));
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: '戻る' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
  it('preserves recorded names when editing after a participant is renamed', async () => {
    const payment = paymentFromInputs(defaultCashInputs(settlement), { a: '当時のA', b: 'B', c: 'C', d: 'D' })!;
    const save = vi.fn(async (_day: Omit<DayRecord, 'id' | 'date'>) => {});
    render(<SettlementForm players={players} currentDayGames={games} initialPayment={payment} onSave={save} onCancel={vi.fn()} />);
    openAdvance();
    expect(screen.getByRole('textbox', { name: '当時のAの今日支払った額' })).toBeInTheDocument();
    await confirmSave(); await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0].payment!.names.a).toBe('当時のA');
  });
});

it('retains history cash and scores when a partial and then final repayment is recorded', async () => {
  const day: DayRecord = { id: 'day', date: '2026-11-28', games, chips, tableFee: 0, chipRate: 200, settlement, payment: { version: 1, names: { a: 'A', b: 'B', c: 'C', d: 'D' }, cash: { a: { paid: 5000, received: 0 }, b: { paid: 20000, received: 0 }, c: { paid: 0, received: 15000 }, d: { paid: 0, received: 10000 } }, repayments: [] } };
  const recordRepayment = vi.fn(async (id: string, repayment: Repayment) => {
    useAppStore.setState(s => ({ history: s.history.map(record => record.id === id ? { ...record, payment: appendRepayment(record, repayment) } : record) }));
  });
  useAppStore.setState({ history: [day], recordRepayment });
  function History() { const record = useAppStore(s => s.history[0]); return <PaymentHistory day={record} players={players} />; }
  render(<History />);
  change('AからBへの返済額', '0');
  expect(screen.getByRole('textbox', { name: 'AからBへの返済額' })).toHaveAccessibleDescription('1円〜15,000円で入力してください');
  expect(screen.getByRole('button', { name: '返済を記録' })).toBeDisabled();
  change('AからBへの返済額', '5000');
  fireEvent.click(screen.getByRole('button', { name: '返済を記録' }));
  expect(recordRepayment).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '受け渡し済みとして記録' }));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('5,000円を記録'));
  expect(screen.getByRole('textbox', { name: 'AからBへの返済額' })).toHaveValue('10000');
  fireEvent.click(screen.getByRole('button', { name: '返済を記録' }));
  fireEvent.click(screen.getByRole('button', { name: '受け渡し済みとして記録' }));
  await waitFor(() => expect(screen.queryByRole('button', { name: '返済を記録' })).not.toBeInTheDocument());
  expect(useAppStore.getState().history[0].settlement).toEqual(settlement);
  expect(useAppStore.getState().history[0].payment!.cash).toEqual(day.payment!.cash);
  expect(useAppStore.getState().history[0].payment!.repayments).toHaveLength(2);
});
