import { useEffect, useId, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, HandCoins } from 'lucide-react';
import type { DayPayment, DaySettlementEntry } from '../../types';
import { calculatePaymentPlan, parseCashAmount, type CashInputs, type PaymentPlan } from '../../lib/payments';
import { formatYen } from '../../lib/format';

export function PaymentTransfers({ plan, names }: { plan: Extract<PaymentPlan, { ok: true }>; names: Record<string, string> }) {
  return <section className="payment-transfers" aria-label="後日返すお金">
    <h3>後日返すお金</h3>
    {plan.transfers.length === 0 ? <p className="payment-balanced"><Check size={18} aria-hidden="true" />立て替え・未払いはありません</p> : <>
      <p className="muted">入力した金額の差から、返済先を自動で割り当てています。</p>
      <ul>{plan.transfers.map(item => <li key={JSON.stringify([item.from, item.to])}>
        <div><strong>{names[item.from] ?? '不明'}</strong><ArrowRight size={18} aria-label="から" /><strong>{names[item.to] ?? '不明'}</strong></div>
        <span>{formatYen(item.remaining)}円{item.repaid > 0 && <small>返済済み {formatYen(item.repaid)}円 / 立替額 {formatYen(item.amount)}円</small>}</span>
      </li>)}</ul>
      <p className="payment-total">返済待ち <strong>{formatYen(plan.outstanding)}<small>円</small></strong></p>
    </>}
  </section>;
}

export function PaymentAdjustment({ settlement, tableFee, inputs, names, payment, onChange, onBack, onSave, saving, saveError }: {
  settlement: Record<string, DaySettlementEntry>;
  tableFee: number;
  inputs: CashInputs;
  names: Record<string, string>;
  payment: DayPayment | null;
  onChange: (inputs: CashInputs) => void;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
  saveError: string | null;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const id = useId();
  useEffect(() => { heading.current?.focus(); heading.current?.scrollIntoView?.({ block: 'start' }); }, []);
  const plan = payment ? calculatePaymentPlan(settlement, payment) : null;
  const feeTotal = Object.values(settlement).reduce((sum, entry) => sum + entry.tableFeeShare, 0);
  const field = (pid: string, kind: 'paid' | 'received') => {
    const value = inputs[pid]?.[kind] ?? '';
    const invalid = parseCashAmount(value) === null;
    const inputId = `${id}-${pid}-${kind}`;
    const label = kind === 'paid' ? '今日支払った額' : '今日受け取った額';
    return <label htmlFor={inputId}><span>{label}</span><div className="payment-amount-input"><input id={inputId} name={`${pid}-${kind}`} aria-label={`${names[pid]}の${label}`} type="text" inputMode="numeric" autoComplete="off" value={value} aria-invalid={invalid} aria-describedby={invalid ? `${inputId}-error` : undefined} onChange={event => onChange({ ...inputs, [pid]: { ...inputs[pid], [kind]: event.target.value } })} /><span>円</span></div>{invalid && <small id={`${inputId}-error`} className="payment-error">0円以上の整数を入力してください</small>}</label>;
  };
  return <fieldset disabled={saving} className="payment-adjustment">
    <button type="button" className="payment-back" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" />精算内容に戻る</button>
    <header><HandCoins size={24} aria-hidden="true" /><h2 ref={heading} tabIndex={-1}>立て替えを含めて精算</h2></header>
    <p>今日やり取りした金額を入力してください。勝った人が受け取りを減らした場合も、後日の返済額を計算します。</p>
    <p className="payment-note">初期値は通常精算の金額です。今日の実額に書き換えてください。場代としてお店へ直接支払った額も含めます。</p>
    <div className="payment-cash-list">{Object.entries(settlement).map(([pid, entry]) => <section key={pid} aria-label={`${names[pid]}の支払い`}>
      <div className="payment-player"><h3>{names[pid]}</h3><span>本来は {entry.totalWithFee < 0 ? '支払い' : '受け取り'} <strong>{formatYen(Math.abs(entry.totalWithFee))}円</strong><small>場代込み</small></span></div>
      <div className="payment-fields">{field(pid, 'paid')}{field(pid, 'received')}</div>
    </section>)}</div>
    <p className="payment-note">場代の負担合計 {formatYen(feeTotal)}円{feeTotal !== tableFee && `（実費 ${formatYen(tableFee)}円・均等割の端数調整 ${formatYen(feeTotal - tableFee)}円を含む）`}。支払合計から受取合計を引いた金額と一致させてください。</p>
    <div aria-live="polite">{!payment ? <p className="payment-error">全員の支払額・受取額を入力してください。移動がない場合は0円です。</p> : plan && !plan.ok ? <p className="payment-error" role="alert">{plan.error}</p> : plan?.ok ? <PaymentTransfers plan={plan} names={names} /> : null}</div>
    {saveError && <p className="payment-error" role="alert">{saveError}</p>}
    <p className="payment-note">この内容を履歴に記録します。アプリからの送金は行いません。戦績・順位・段位の金額は変わりません。</p>
    <button type="button" className="solid-action payment-save" disabled={saving || !plan?.ok} onClick={onSave}>{saving ? '保存中…' : 'この支払い内容で精算を保存'}</button>
  </fieldset>;
}
