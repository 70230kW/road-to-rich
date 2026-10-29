import { ArrowLeft, ArrowRight, ChevronRight, Crown, Medal } from 'lucide-react';
import { formatRatePercentage } from '../../lib/format';
import { ScrambleText } from '../common/ScrambleText';
import { PodiumModel } from './PodiumModel';
import { usePodiumCarousel } from './usePodiumCarousel';
import './podiumSpotlight.css';

export interface PodiumEntry {
  id: string; name: string; place: number; tier?: string;
  amount: string; amountLabel: string | null; positive: boolean; hanchanCount: number;
  topRate?: number | null; rentaiRate?: number | null; avgRank?: number | null;
}

export function PodiumSpotlight({ entries, onOpen }: { entries: PodiumEntry[]; onOpen: (id: string) => void }) {
  const { viewport, index, select, step, ...gestures } = usePodiumCarousel(entries.map(entry => entry.id));
  const current = entries[index];
  if (!current) return null;
  return <section className="podium-spotlight" aria-label="上位3名" aria-roledescription="カルーセル">
    <div className="podium-picks" role="group" aria-label="表彰する雀士を選択">
      {entries.map((entry, i) => <button type="button" key={entry.id} aria-pressed={index === i} onClick={() => select(i)}>
        <span>{entry.place}位</span><strong>{entry.name}</strong>
      </button>)}
    </div>
    <div ref={viewport} className="podium-viewport" role="group" tabIndex={0} aria-label="上位雀士の戦績と麻雀牌。左右キーまたは横スワイプで雀士を切り替え" data-pull-ignore {...gestures}>
      {entries.map((entry, i) => <article key={entry.id} className="podium-feature" data-podium-slide={i} aria-hidden={i !== index} inert={i !== index} data-medal={entry.place === 1 ? 'gold' : entry.place === 2 ? 'silver' : 'bronze'}>
        <div className="podium-info">
          <span className="podium-place">{entry.place === 1 ? <Crown size={19} aria-hidden="true" /> : <Medal size={19} aria-hidden="true" />}第{entry.place}位</span>
          <h3>{entry.name}</h3>
          <p className="podium-meta">{entry.tier && <span>{entry.tier}</span>}<span>{entry.hanchanCount}半荘</span></p>
          <div className="podium-amount"><span>{entry.amountLabel ?? '場代抜き収支'}</span><strong className={entry.positive ? 'profit-positive' : 'profit-negative'}><ScrambleText text={entry.amount} /></strong><small>円</small></div>
          <dl className="podium-stats">
            <div><dt>トップ率</dt><dd>{formatRatePercentage(entry.topRate)}</dd></div>
            <div><dt>連対率</dt><dd>{formatRatePercentage(entry.rentaiRate)}</dd></div>
            <div><dt>平均順位</dt><dd>{entry.avgRank == null ? '—' : `${entry.avgRank.toFixed(2)}位`}</dd></div>
          </dl>
          <button type="button" className="podium-detail" aria-label={`${entry.place}位 ${entry.name}の成績詳細`} onClick={() => onOpen(entry.id)}>成績詳細<ChevronRight size={16} aria-hidden="true" /></button>
        </div>
        <div className="podium-art"><PodiumModel name={entry.name} place={entry.place} /></div>
      </article>)}
    </div>
    {entries.length > 1 && <div className="podium-controls"><span>左右にスワイプして<br />雀士を切り替え</span><div><button type="button" aria-label="前の雀士" onClick={() => step(-1)}><ArrowLeft size={18} /></button><span aria-hidden="true">{index + 1} / {entries.length}</span><button type="button" aria-label="次の雀士" onClick={() => step(1)}><ArrowRight size={18} /></button></div></div>}
    <span className="sr-only" role="status" aria-live="polite">{current.place}位、{current.name}を表示中</span>
  </section>;
}
