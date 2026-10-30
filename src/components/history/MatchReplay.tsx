import { useId, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { DayRecord, Player } from '../../types';
import { buildMatchReplay } from '../../lib/matchReplay';
import { formatSignedYen } from '../../lib/format';
import '../../styles/review.css';

export function MatchReplay({ day, players, historyBefore = [] }: { day: DayRecord; players: Player[]; historyBefore?: DayRecord[] }) {
  const frames = useMemo(() => buildMatchReplay(day, players, historyBefore), [day, players, historyBefore]);
  const [position, setPosition] = useState({ dayId: day.id, step: 0, direction: 1 });
  const step = position.dayId === day.id ? Math.min(position.step, frames.length - 1) : 0;
  const frame = frames[step];
  const labelId = useId();
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const go = (next: number) => setPosition({ dayId: day.id, step: Math.max(0, Math.min(next, frames.length - 1)), direction: next >= step ? 1 : -1 });
  if (!day.games.length) return <p className="review-empty">振り返る半荘記録がありません。</p>;

  return <section className="match-replay" aria-labelledby={labelId}>
    <header className="review-heading"><div><p className="eyebrow">MATCH REPLAY</p><h3 id={labelId}>対局会を振り返る</h3></div><span>{day.session?.title ?? '半荘の記録'}</span></header>
    <p className="review-caption">保存された半荘収支の累計 · チップ・場代を除く。左右にスワイプして進めます。</p>
    <div className="replay-stage" tabIndex={0} role="group" aria-label="半荘の振り返り。左右キーで移動" data-pull-ignore
      onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); go(step + (event.key === 'ArrowLeft' ? -1 : 1)); } }}
      onPointerDown={event => { if (!event.isPrimary || event.button !== 0) return; drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture?.(event.pointerId); }}
      onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}
      onPointerUp={event => {
        const start = drag.current; drag.current = null;
        if (!start || start.id !== event.pointerId) return;
        const dx = event.clientX - start.x, dy = event.clientY - start.y;
        if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.4) go(step + (dx < 0 ? 1 : -1));
      }}>
      <div className="replay-moment" role="status" aria-live="polite"><strong>{step === 0 ? '対局開始前' : `第${step}半荘終了`}</strong><span>{step} / {day.games.length}{step === day.games.length ? ' · 最終結果' : ''}</span></div>
      <div key={`${day.id}-${step}`} className="replay-frame" data-direction={position.direction}>
      <ol className="replay-standings" aria-label="この時点の累計順位">
        {frame.rows.map(row => <li key={row.id}><span className="replay-rank">{row.rank ?? '—'}<small>{row.rank ? '位' : ''}</small></span><div><strong>{row.name}</strong><small>{row.count ? `${row.count}半荘参加` : 'まだ対局していません'}</small></div><div className="replay-profit"><strong className={row.profit < 0 ? 'profit-negative' : 'profit-positive'}>{formatSignedYen(row.profit)}<small>円</small></strong><small>この半荘 {formatSignedYen(row.delta)}円</small></div></li>)}
      </ol>
      {frame.highlights.length > 0 && <ul className="replay-highlights">{frame.highlights.map(text => <li key={text}>{text}</li>)}</ul>}
      {frame.note && <p className="replay-note"><span>対局メモ</span>{frame.note}</p>}
      </div>
    </div>
    <label className="replay-scrubber"><span>半荘を選ぶ</span><input type="range" min={0} max={day.games.length} step={1} value={step} aria-valuetext={step ? `第${step}半荘終了` : '対局開始前'} onChange={event => go(Number(event.target.value))} /></label>
    <nav className="review-controls" aria-label="リプレイ操作"><button type="button" disabled={step === 0} onClick={() => go(step - 1)}><ArrowLeft size={18} />前の半荘</button><button type="button" disabled={step === day.games.length} onClick={() => go(step + 1)}>次の半荘<ArrowRight size={18} /></button></nav>
    <p className="review-caption">同額は同順位。自己最高素点は、この対局会より前の記録とそれまでの半荘で比較します。</p>
  </section>;
}
