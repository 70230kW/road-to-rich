import { describe, expect, it } from 'vitest';
import { appendRepayment, calculatePaymentPlan, defaultCashInputs, parseCashAmount, paymentFromInputs, validatePaymentEdit } from '../lib/payments';
import type { DayPayment, DayRecord, DaySettlementEntry, Repayment } from '../types';

function results(values: Record<string, number>, fee = 0): Record<string, DaySettlementEntry> {
  return Object.fromEntries(Object.entries(values).map(([id, profit]) => [id, { gamesTotal: profit, chipCount: 0, chipValue: 0, tableFeeShare: fee, totalWithoutFee: profit, totalWithFee: profit - fee }]));
}
const settlement = results({ a: -20000, b: -5000, c: 15000, d: 10000 });
function payment(cash: [number, number][] = [[5000, 0], [20000, 0], [0, 15000], [0, 10000]]): DayPayment {
  return { version: 1, cash: Object.fromEntries(cash.map(([paid, received], i) => ['abcd'[i], { paid, received }])), names: { a: 'A', b: 'B', c: 'C', d: 'D' }, repayments: [] };
}
const repay: Repayment = { id: 'repay-1', from: 'a', to: 'b', amount: 5000, recordedAt: '2026-11-28T12:00:00Z' };

describe('actual cash and advances', () => {
  it('does not change results or create debt for a normal settlement', () => {
    const record = paymentFromInputs(defaultCashInputs(settlement), {})!;
    const before = structuredClone(settlement);
    expect(calculatePaymentPlan(settlement, record)).toMatchObject({ ok: true, outstanding: 0, transfers: [], feeTotal: 0 });
    expect(settlement).toEqual(before);
  });
  it('allocates a partially unpaid loss to someone who pays extra', () => {
    expect(calculatePaymentPlan(settlement, payment())).toMatchObject({ ok: true, outstanding: 15000, transfers: [{ from: 'a', to: 'b', amount: 15000, remaining: 15000, repaid: 0 }] });
  });
  it('supports a winner deferring their receipt', () => {
    expect(calculatePaymentPlan(settlement, payment([[5000, 0], [5000, 0], [0, 0], [0, 10000]]))).toMatchObject({ ok: true, transfers: [{ from: 'a', to: 'c', amount: 15000 }] });
  });
  it('allocates multiple debtors and creditors deterministically, conserving every yen', () => {
    const record = payment([[5000, 0], [0, 0], [0, 3000], [0, 2000]]);
    const plan = calculatePaymentPlan(settlement, record);
    expect(plan).toMatchObject({ ok: true, outstanding: 20000, transfers: [{ from: 'a', to: 'c', amount: 12000 }, { from: 'a', to: 'd', amount: 3000 }, { from: 'b', to: 'd', amount: 5000 }] });
    expect(calculatePaymentPlan(Object.fromEntries(Object.entries(settlement).reverse()), record)).toEqual(plan);
  });
  it('preserves three-player fee rounding and balanced chips in the original results', () => {
    const three = results({ a: -10000, b: 8000, c: 2000 }, 334);
    const record: DayPayment = { version: 1, cash: { a: { paid: 3334, received: 0 }, b: { paid: 0, received: 666 }, c: { paid: 0, received: 1666 } }, names: {}, repayments: [] };
    expect(calculatePaymentPlan(three, record)).toMatchObject({ ok: true, feeTotal: 1002, outstanding: 7000, transfers: [{ from: 'a', to: 'b', amount: 7000 }] });
  });
  it('reports shortage and excess rather than silently moving money', () => {
    const record = payment(); record.cash.b.paid = 19000;
    expect(calculatePaymentPlan(settlement, record)).toMatchObject({ ok: false, error: expect.stringContaining('1,000円不足') });
    record.cash.b.paid = 21000;
    expect(calculatePaymentPlan(settlement, record)).toMatchObject({ ok: false, error: expect.stringContaining('1,000円余') });
  });
  it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid cash %s', amount => {
    const record = payment(); record.cash.a.paid = amount;
    expect(calculatePaymentPlan(settlement, record).ok).toBe(false);
  });
  it('rejects missing players, non-zero scoring totals and fractional-yen results', () => {
    const record = payment(); delete record.cash.a;
    expect(calculatePaymentPlan(settlement, record).ok).toBe(false);
    expect(calculatePaymentPlan(results({ a: -20000, b: -5000, c: 15000, d: 10001 }), payment()).ok).toBe(false);
    expect(calculatePaymentPlan(results({ a: -0.5, b: 0.5 }), payment()).ok).toBe(false);
  });
  it.each(['', '-', '1.5', 'NaN', 'Infinity', '1e3', '9007199254740992'])('does not treat incomplete or invalid input %s as zero', value => expect(parseCashAmount(value)).toBeNull());
  it('accepts zero and integer yen', () => { expect(parseCashAmount('0')).toBe(0); expect(parseCashAmount(' 25000 ')).toBe(25000); });
});

describe('repayment integrity', () => {
  it('tracks partial and full repayments without changing the original cash or score', () => {
    const day = { settlement, payment: payment() };
    const first = appendRepayment(day, repay);
    expect(calculatePaymentPlan(settlement, first)).toMatchObject({ ok: true, outstanding: 10000, transfers: [{ amount: 15000, repaid: 5000, remaining: 10000 }] });
    const second = appendRepayment({ settlement, payment: first }, { ...repay, id: 'repay-2', amount: 10000 });
    expect(calculatePaymentPlan(settlement, second)).toMatchObject({ ok: true, outstanding: 0 });
    expect(day.payment.repayments).toHaveLength(0);
    expect(second.cash).toEqual(day.payment.cash);
  });
  it('retries one operation idempotently and rejects overpayment or changing that operation', () => {
    const first = appendRepayment({ settlement, payment: payment() }, repay);
    expect(appendRepayment({ settlement, payment: first }, repay).repayments).toHaveLength(1);
    expect(() => appendRepayment({ settlement, payment: first }, { ...repay, amount: 100 })).toThrow();
    expect(() => appendRepayment({ settlement, payment: first }, { ...repay, id: 'different', amount: 10001 })).toThrow();
    expect(() => appendRepayment({ settlement, payment: first }, { ...repay, id: 'different', from: 'b', to: 'a' })).toThrow();
  });
  it('blocks stale edits, repayment removal and changing the creditor after repayment', () => {
    const initial = payment();
    const current = { id: 'day', date: '', games: [], chips: {}, chipRate: 0, tableFee: 0, settlement, payment: appendRepayment({ settlement, payment: initial }, repay) } as DayRecord;
    expect(() => validatePaymentEdit(current, { ...current, payment: initial })).toThrow('更新されています');
    expect(() => validatePaymentEdit(current, { ...current, payment: null })).toThrow();
    expect(() => validatePaymentEdit(current, { ...current, payment: undefined })).not.toThrow();
    expect(() => validatePaymentEdit(current, { ...current, payment: undefined, settlement: results({ a: -15000, b: -10000, c: 15000, d: 10000 }) })).toThrow();
    const switched = payment([[5000, 0], [5000, 0], [0, 0], [0, 10000]]); switched.repayments = current.payment!.repayments;
    expect(() => validatePaymentEdit(current, { ...current, payment: switched })).toThrow('返済');
  });
});
