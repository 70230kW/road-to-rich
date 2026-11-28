import type { DayPayment, DayRecord, DaySettlementEntry, Player, PlayerCash, Repayment } from '../types';
import { sameStoredValue } from './storedValue';

export interface PaymentTransfer { from: string; to: string; amount: number; repaid: number; remaining: number; }
export type PaymentPlan = { ok: false; error: string } | {
  ok: true;
  transfers: PaymentTransfer[];
  outstanding: number;
  feeTotal: number;
  paidTotal: number;
  receivedTotal: number;
};
export type CashInputs = Record<string, { paid: string; received: string }>;
/** Keep the recorded identity even after a player is renamed or removed. */
export function paymentParticipantNames(ids: string[], players: Player[], payment?: DayPayment | null): Record<string, string> {
  return Object.fromEntries(ids.map(id => [id, payment?.names?.[id] ?? players.find(player => player.id === id)?.name ?? '不明']));
}
const yen = (value: number) => value.toLocaleString('ja-JP');
const isAmount = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
export function parseCashAmount(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const amount = Number(value);
  return isAmount(amount) ? amount : null;
}
export function defaultCashInputs(settlement: Record<string, DaySettlementEntry>, payment?: DayPayment | null): CashInputs {
  return Object.fromEntries(Object.entries(settlement).map(([id, entry]) => [id, {
    paid: String(payment?.cash[id]?.paid ?? Math.max(0, -entry.totalWithFee)),
    received: String(payment?.cash[id]?.received ?? Math.max(0, entry.totalWithFee)),
  }]));
}
export function paymentFromInputs(inputs: CashInputs, names: Record<string, string>, repayments: Repayment[] = []): DayPayment | null {
  const cash: Record<string, PlayerCash> = {};
  for (const [id, input] of Object.entries(inputs)) {
    const paid = parseCashAmount(input.paid), received = parseCashAmount(input.received);
    if (paid === null || received === null) return null;
    cash[id] = { paid, received };
  }
  return { version: 1, cash, names, repayments };
}

/** Cash and results are separate ledgers. No rounding or score mutation here. */
export function calculatePaymentPlan(settlement: Record<string, DaySettlementEntry>, payment: DayPayment): PaymentPlan {
  const fail = (error: string): PaymentPlan => ({ ok: false, error });
  const ids = Object.keys(settlement).sort();
  if (!ids.length || payment.version !== 1 || !payment.cash || !Array.isArray(payment.repayments)) return fail('支払い記録を読み取れません。精算内容を確認してください。');
  if (Object.keys(payment.cash).length !== ids.length || ids.some(id => !Object.hasOwn(payment.cash, id))) return fail('参加者が変更されています。支払額・受取額を確認してください。');
  let feeTotal = 0, resultTotal = 0, paidTotal = 0, receivedTotal = 0;
  const debtors: { id: string; amount: number }[] = [], creditors: { id: string; amount: number }[] = [];
  for (const id of ids) {
    const entry = settlement[id], cash = payment.cash[id];
    if (!cash || !isAmount(cash.paid) || !isAmount(cash.received) || !isAmount(entry.tableFeeShare) || !Number.isSafeInteger(entry.totalWithoutFee) || !Number.isSafeInteger(entry.totalWithFee) || entry.totalWithFee !== entry.totalWithoutFee - entry.tableFeeShare) return fail('金額は0円以上・1円単位で入力してください。精算額も1円単位である必要があります。');
    feeTotal += entry.tableFeeShare; resultTotal += entry.totalWithoutFee;
    paidTotal += cash.paid; receivedTotal += cash.received;
    const gross = entry.totalWithFee + cash.paid;
    const balance = gross - cash.received;
    if (![gross, balance, feeTotal, resultTotal, paidTotal, receivedTotal].every(Number.isSafeInteger)) return fail('金額が大きすぎます。入力を確認してください。');
    if (balance < 0) debtors.push({ id, amount: -balance });
    if (balance > 0) creditors.push({ id, amount: balance });
  }
  if (![feeTotal, resultTotal, paidTotal, receivedTotal, paidTotal - receivedTotal - feeTotal].every(Number.isSafeInteger)) return fail('合計金額が大きすぎます。入力を確認してください。');
  if (resultTotal !== 0) return fail('対局・チップの収支合計が0円になっていません。元の精算内容を確認してください。');
  const difference = paidTotal - receivedTotal - feeTotal;
  if (difference < 0) return fail(`支払いがあと${yen(-difference)}円不足しています。立替者の支払額を増やすか、受け取った額を減らしてください。`);
  if (difference > 0) return fail(`支払いが${yen(difference)}円余っています。受け取った額、または支払額を確認してください。`);
  const transfers: PaymentTransfer[] = [];
  let creditorIndex = 0;
  for (const debtor of debtors) {
    let remaining = debtor.amount;
    while (remaining > 0 && creditorIndex < creditors.length) {
      const creditor = creditors[creditorIndex];
      const amount = Math.min(remaining, creditor.amount);
      transfers.push({ from: debtor.id, to: creditor.id, amount, repaid: 0, remaining: amount });
      remaining -= amount; creditor.amount -= amount;
      if (creditor.amount === 0) creditorIndex++;
    }
  }
  const seenRepayments = new Set<string>();
  for (const repayment of payment.repayments) {
    if (!repayment || !repayment.id || seenRepayments.has(repayment.id) || !isAmount(repayment.amount) || repayment.amount === 0 || !Number.isFinite(Date.parse(repayment.recordedAt))) return fail('返済記録が正しくありません。履歴を確認してください。');
    seenRepayments.add(repayment.id);
    const transfer = transfers.find(item => item.from === repayment.from && item.to === repayment.to);
    if (!transfer || repayment.amount > transfer.remaining) return fail('既存の返済記録と精算内容が一致しません。返済済みの金額・返済先が変わる編集は保存できません。');
    transfer.repaid += repayment.amount;
    transfer.remaining -= repayment.amount;
  }
  const outstanding = transfers.reduce((sum, transfer) => sum + transfer.remaining, 0);
  if (!Number.isSafeInteger(outstanding)) return fail('合計金額が大きすぎます。入力を確認してください。');
  return { ok: true, transfers, outstanding, feeTotal, paidTotal, receivedTotal };
}

/** Used inside a Firestore transaction; a retried request ID is idempotent. */
export function appendRepayment(day: Pick<DayRecord, 'settlement' | 'payment'>, repayment: Repayment): DayPayment {
  if (!day.payment) throw new Error('立て替え記録がありません。履歴を更新してください。');
  const existing = day.payment.repayments.find(item => item.id === repayment.id);
  if (existing) {
    if (!sameStoredValue(existing, repayment)) throw new Error('同じ操作IDの返済内容が一致しません。');
    return day.payment;
  }
  const next = { ...day.payment, repayments: [...day.payment.repayments, repayment] };
  const plan = calculatePaymentPlan(day.settlement, next);
  if (!plan.ok) throw new Error(plan.error);
  return next;
}

/** Reject stale edits instead of erasing repayments recorded by another client. */
export function validatePaymentEdit(current: DayRecord, patch: Omit<DayRecord, 'id' | 'date'>): void {
  if (patch.payment === undefined) {
    if (current.payment && !sameStoredValue(current.settlement, patch.settlement)) throw new Error('立て替え記録のある精算です。支払額・受取額も確認して保存してください。');
    return;
  }
  if (!sameStoredValue(current.payment?.repayments ?? [], patch.payment?.repayments ?? [])) throw new Error('返済記録が更新されています。履歴を開き直してから編集してください。');
  if (patch.payment) {
    const plan = calculatePaymentPlan(patch.settlement, patch.payment);
    if (!plan.ok) throw new Error(plan.error);
  }
}
