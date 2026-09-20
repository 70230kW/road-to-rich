import { useEffect, useRef } from 'react';
import { Check, ArrowRight, Undo2 } from 'lucide-react';
import { formatSignedYen } from '../../lib/format';
export function SaveReceipt({ title, detail, rows, onNext, onSettle, onUndo, nextLabel = '次の半荘へ' }: {
  title: string; detail: string; rows: { id: string; name: string; profit: number; rank?: number }[];
  onNext: () => void; onSettle?: () => void; onUndo?: () => void | Promise<void>; nextLabel?: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return <section className="save-receipt">
    <span className="save-check" aria-hidden="true"><Check size={30} /></span>
    <p className="eyebrow">RECORDED</p><h2 tabIndex={-1} ref={heading}>{title}</h2><p className="muted text-xs">{detail}</p>
    <ul>{rows.map(row => <li key={row.id}>{row.rank && <span className={`placement placement-${row.rank}`}>{row.rank}<span className="sr-only">位</span></span>}<strong>{row.name}</strong><span className={row.profit >= 0 ? 'profit-positive' : 'profit-negative'}>{formatSignedYen(row.profit)}円</span></li>)}</ul>
    <button type="button" className="solid-action" onClick={onNext}>{nextLabel}<ArrowRight size={18}/></button>
    {onUndo && <button type="button" className="receipt-undo" onClick={onUndo}><Undo2 size={16} />直前の保存を取り消す</button>}
    {onSettle && <button type="button" className="details-toggle" onClick={onSettle}>本日の精算へ →</button>}
  </section>;
}
