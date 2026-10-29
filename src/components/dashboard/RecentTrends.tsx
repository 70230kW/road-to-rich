import { useId, useMemo, useState } from 'react';
import type { DayRecord, PlayerCount } from '../../types';
import { computeRecentTrends, playerTrendGames } from '../../lib/recentTrends';
import { formatDateShort, formatRatePercentage, formatSignedYen } from '../../lib/format';
import '../../styles/review.css';

export function RecentTrends({ history, playerId, periodLabel }: { history: DayRecord[]; playerId: string; periodLabel: string }) {
  const [preferredCount, setPreferredCount] = useState<PlayerCount>(4);
  const counts = useMemo(() => ([4, 3] as const).filter(count => playerTrendGames(history, playerId, count).length), [history, playerId]);
  const count = counts.includes(preferredCount) ? preferredCount : counts[0] ?? 4;
  const trend = useMemo(() => computeRecentTrends(history, playerId, count), [history, playerId, count]);
  const id = useId();
  const { recent, previous, ready } = trend;
  const metrics = [
    { label: 'トップ率', current: recent.topRate, before: previous.topRate, rate: true, lower: false },
    { label: 'ラス回避率', current: recent.avoidLastRate, before: previous.avoidLastRate, rate: true, lower: false },
    { label: '平均順位', current: recent.avgRank, before: previous.avgRank, rate: false, lower: true },
    { label: '半荘収支', current: recent.profit, before: previous.profit, rate: false, lower: false },
  ];
  const range = (sample: typeof recent) => sample.first && sample.last ? `${formatDateShort(sample.first.date)} 第${sample.first.number}半荘〜${formatDateShort(sample.last.date)} 第${sample.last.number}半荘` : '記録なし';

  return <section className="recent-trends" aria-labelledby={id}>
    <header className="review-heading"><div><p className="eyebrow">RECENT FORM</p><h3 id={id}>数字で見る、最近の変化</h3></div><span>{periodLabel} · {count}人麻雀</span></header>
    {counts.length > 1 && <div className="review-format" aria-label="比較する対局形式">{counts.map(value => <button type="button" key={value} aria-pressed={count === value} onClick={() => setPreferredCount(value)}>{value}人麻雀</button>)}</div>}
    <p className="review-caption">選択期間内の同じ対局形式で比較します。収支はチップ・場代を除く保存済みの金額です。</p>
    {!recent.count ? <p className="review-empty">この期間には、比較できる半荘がありません。</p> : <>
      <div className="trend-windows"><div><span>直近{recent.count}半荘</span><small>{range(recent)}</small></div><div><span>その前の{previous.count}半荘</span><small>{range(previous)}</small></div></div>
      <p className="trend-summary" role="status">{ready
        ? `直近20半荘は、その前の20半荘に比べてトップ率が${((recent.topRate! - previous.topRate!) * 100).toFixed(1)}ポイント、ラス回避率が${((recent.avoidLastRate! - previous.avoidLastRate!) * 100).toFixed(1)}ポイント変化しています。`
        : `同条件の20半荘ずつで比較するには、あと${trend.missing}半荘必要です。現在は参考値を表示し、差分の評価は行いません。`}</p>
      <div className="trend-table-wrap"><table className="trend-table"><caption className="sr-only">直近とその前の成績比較</caption><thead><tr><th scope="col">指標</th><th scope="col">その前<small>{previous.count}半荘</small></th><th scope="col">直近<small>{recent.count}半荘</small></th><th scope="col">差分</th></tr></thead><tbody>
        {metrics.map(metric => {
          const format = (value: number | null) => value === null ? '—' : metric.rate ? formatRatePercentage(value) : metric.label === '平均順位' ? `${value.toFixed(2)}位` : `${formatSignedYen(value)}円`;
          const delta = ready ? metric.current! - metric.before! : null;
          const deltaText = delta === null ? '—' : `${delta > 0 ? '+' : ''}${metric.rate ? (delta * 100).toFixed(1) : metric.label === '平均順位' ? delta.toFixed(2) : Math.round(delta).toLocaleString('ja-JP')}${metric.rate ? 'pt' : metric.label === '平均順位' ? '位' : '円'}`;
          return <tr key={metric.label}><th scope="row">{metric.label}</th><td>{format(metric.before)}{metric.rate && metric.before !== null && <span className="trend-meter before" aria-hidden="true"><i style={{ width: `${metric.before * 100}%` }} /></span>}</td><td>{format(metric.current)}{metric.rate && metric.current !== null && <span className="trend-meter" aria-hidden="true"><i style={{ width: `${metric.current * 100}%` }} /></span>}</td><td className={delta ? (metric.lower ? delta < 0 : delta > 0) ? 'profit-positive' : 'profit-negative' : ''}>{deltaText}</td></tr>;
        })}
      </tbody></table></div>
      <p className="review-caption">pt＝パーセントポイント。平均順位は小さいほど上位です。成績の変化であり、実力や打ち方の評価ではありません。</p>
      <div className="trend-contributions"><h4>直近の収支に影響した対局会</h4><p className="review-caption">直近{recent.count}半荘に含まれる分だけを集計し、金額の絶対値順に最大3件表示します。</p>
        <ol>{trend.contributions.slice(0, 3).map(day => <li key={day.id}><div><strong>{day.title}</strong><small>{formatDateShort(day.date)} · 対象{day.count}半荘</small></div><strong className={day.profit < 0 ? 'profit-negative' : 'profit-positive'}>{formatSignedYen(day.profit)}<small>円</small></strong></li>)}</ol>
      </div>
    </>}
  </section>;
}
