import { useId, useRef, useState } from 'react';
import type { DayRecord, Player, Repayment } from '../../types';
import { calculatePaymentPlan, parseCashAmount, paymentParticipantNames } from '../../lib/payments';
import { formatYen } from '../../lib/format';
import { useAppStore } from '../../store/useAppStore';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PaymentTransfers } from '../input/PaymentAdjustment';

export function PaymentHistory({ day, players }: { day: DayRecord; players: Player[] }) {
  const recordRepayment = useAppStore(s => s.recordRepayment);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<Repayment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const retryRef = useRef<Repayment | null>(null);
  const prefix = useId();
  if (!day.payment) return null;
  const payment = day.payment;
  const names = paymentParticipantNames(Object.keys(payment.cash), players, payment);
  const plan = calculatePaymentPlan(day.settlement, payment);
  const save = async () => {
    if (!pending || savingRef.current) return;
    savingRef.current = true; setSaving(true); setError(null);
    try {
      await recordRepayment(day.id, pending);
      setNotice(`${names[pending.from]}から${names[pending.to]}への返済 ${formatYen(pending.amount)}円を記録しました。`);
      setInputs({}); setPending(null); retryRef.current = null;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存できませんでした。接続を確認して再試行してください。');
      retryRef.current = pending;
      setPending(null);
    } finally { savingRef.current = false; setSaving(false); }
  };
  return <section className="payment-history" aria-label="支払い・立て替え記録">
    <h3>支払い・立て替え記録</h3>
    {plan.ok ? <PaymentTransfers plan={plan} names={names} /> : <p className="payment-error" role="alert">{plan.error}</p>}
    {error && <p className="payment-error" role="alert">{error}</p>}
    <p role="status" className="payment-note">{notice}</p>
    {plan.ok && plan.transfers.filter(item => item.remaining > 0).map(item => {
      const key = JSON.stringify([item.from, item.to]);
      const value = inputs[key] ?? String(item.remaining);
      const amount = parseCashAmount(value);
      const invalid = amount === null || amount === 0 || amount > item.remaining;
      const id = `${prefix}-${item.from}-${item.to}`;
      return <div key={key} className="payment-repay-form"><p>{names[item.from]} → {names[item.to]}</p><div className="payment-repay-fields">
        <label htmlFor={id}>受け渡し済みの返済額<div className="payment-amount-input"><input id={id} type="text" inputMode="numeric" autoComplete="off" name={id} aria-label={`${names[item.from]}から${names[item.to]}への返済額`} aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined} value={value} disabled={saving} onChange={event => { setInputs({ ...inputs, [key]: event.target.value }); retryRef.current = null; }} /><span>円</span></div></label>
        <button type="button" disabled={saving || invalid} onClick={() => { if (invalid) return; const retry = retryRef.current; setPending(retry && retry.from === item.from && retry.to === item.to && retry.amount === amount ? retry : { id: crypto.randomUUID(), from: item.from, to: item.to, amount, recordedAt: new Date().toISOString() }); }}>返済を記録</button>
      </div>{invalid && <small id={`${id}-error`} role="alert" className="payment-error">1円〜{formatYen(item.remaining)}円で入力してください</small>}</div>;
    })}
    <details><summary>当日の支払額・受取額を見る</summary><table><thead><tr><th>雀士</th><th>支払額</th><th>受取額</th></tr></thead><tbody>{Object.entries(payment.cash).map(([pid, cash]) => <tr key={pid}><td>{names[pid]}</td><td>{formatYen(cash.paid)}円</td><td>{formatYen(cash.received)}円</td></tr>)}</tbody></table></details>
    {payment.repayments.length > 0 && <details><summary>返済履歴（{payment.repayments.length}件）</summary><ul>{payment.repayments.map(item => <li key={item.id} className="payment-note">{new Date(item.recordedAt).toLocaleString('ja-JP')} · {names[item.from]} → {names[item.to]} · {formatYen(item.amount)}円</li>)}</ul></details>}
    <p className="payment-note">実際にお金を渡した後に返済を記録してください。戦績・収支には加算されません。</p>
    <ConfirmDialog danger={false} busy={saving} open={pending !== null} title="返済を記録" message={pending ? `${names[pending.from]}から${names[pending.to]}へ${formatYen(pending.amount)}円を返したことを記録します。受け渡しは完了していますか？` : ''} confirmLabel="受け渡し済みとして記録" onCancel={() => { if (!saving) setPending(null); }} onConfirm={save} />
  </section>;
}
