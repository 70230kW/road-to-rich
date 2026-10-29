import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight, Crown, Medal } from 'lucide-react';
import { ScrambleText } from '../common/ScrambleText';
import { PodiumModel } from './PodiumModel';
import './podiumSpotlight.css';

export interface PodiumEntry {
  id: string; name: string; place: number; tier?: string;
  amount: string; amountLabel: string | null; positive: boolean; hanchanCount: number;
}

/** One readable player at a time; the complete leaderboard remains immediately below. */
export function PodiumSpotlight({ entries, onOpen }: { entries: PodiumEntry[]; onOpen: (id: string) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const gesture = useRef<{ id: number; x: number; y: number; axis: 'x' | 'y' | null } | null>(null);
  const index = Math.max(0, entries.findIndex(entry => entry.id === selectedId));
  const current = entries[index];
  if (!current) return null;
  const step = (delta: number) => setSelectedId(entries[(index + delta + entries.length) % entries.length].id);
  const cancel = () => { gesture.current = null; };
  return <section className="podium-spotlight" aria-label="上位3名">
    <div className="podium-picks" role="group" aria-label="表彰する雀士を選択">
      {entries.map(entry => <button type="button" key={entry.id} aria-pressed={current.id === entry.id} onClick={() => setSelectedId(entry.id)}>
        <span>{entry.place}位</span><strong>{entry.name}</strong>
      </button>)}
    </div>
    <div className="podium-feature" data-medal={current.place === 1 ? 'gold' : current.place === 2 ? 'silver' : 'bronze'}>
      <div className="podium-art" data-pull-ignore onPointerDown={event => {
        if (event.button !== 0 || !event.isPrimary) return;
        gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, axis: null };
      }} onPointerMove={event => {
        const start = gesture.current; if (!start || start.id !== event.pointerId) return;
        const dx = event.clientX - start.x, dy = event.clientY - start.y;
        if (!start.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
          start.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
          if (start.axis === 'x') event.currentTarget.setPointerCapture(event.pointerId);
        }
      }} onPointerUp={event => {
        const start = gesture.current; cancel();
        if (start?.id === event.pointerId && start.axis === 'x' && Math.abs(event.clientX - start.x) > 40 && entries.length > 1) step(event.clientX < start.x ? 1 : -1);
      }} onPointerCancel={cancel} onLostPointerCapture={cancel}>
        <PodiumModel name={current.name} place={current.place} />
      </div>
      <div className="podium-info">
        <span className="podium-place">{current.place === 1 ? <Crown size={19} aria-hidden="true" /> : <Medal size={19} aria-hidden="true" />}第{current.place}位<span>LEAGUE LEADERS</span></span>
        <h3>{current.name}</h3>
        <p className="podium-meta">{current.tier && <span>{current.tier}</span>}<span>{current.hanchanCount}半荘</span></p>
        <div className="podium-amount"><span>{current.amountLabel ?? '場代抜き収支'}</span><strong className={current.positive ? 'profit-positive' : 'profit-negative'}><ScrambleText text={current.amount} /></strong><small>円</small></div>
        <button type="button" className="podium-detail" aria-label={`${current.place}位 ${current.name}の成績詳細`} onClick={() => onOpen(current.id)}>成績を詳しく見る<ChevronRight size={18} aria-hidden="true" /></button>
      </div>
    </div>
    {entries.length > 1 && <div className="podium-controls"><span>左右にスワイプして雀士を切り替え</span><div><button type="button" aria-label="前の雀士" onClick={() => step(-1)}><ArrowLeft size={18} /></button><span aria-hidden="true">{index + 1} / {entries.length}</span><button type="button" aria-label="次の雀士" onClick={() => step(1)}><ArrowRight size={18} /></button></div></div>}
    <span className="sr-only" role="status" aria-live="polite">{current.place}位、{current.name}を表示中</span>
  </section>;
}
