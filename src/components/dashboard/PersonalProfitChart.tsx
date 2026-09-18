import { useId, useMemo, useState } from 'react';
import type { DayRecord } from '../../types';
import { formatSignedYen } from '../../lib/format';

export function PersonalProfitChart({ history, playerId }: { history: DayRecord[]; playerId: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const gradientId = useId();
  const points = useMemo(() => {
    let total = 0;
    return [...history].sort((a,b) => Date.parse(a.date)-Date.parse(b.date)).filter(d => d.settlement[playerId]).map(day => {
      total += day.settlement[playerId].totalWithoutFee;
      return { day, total };
    });
  }, [history, playerId]);
  const activeIndex = Math.max(0, selectedId ? points.findIndex(p => p.day.id === selectedId) : points.length - 1);
  const active = points[activeIndex];
  const values = [0, ...points.map(p => p.total)];
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1000;
  const x = (i: number) => 16 + i / Math.max(1, values.length - 1) * 568;
  const y = (v: number) => 180 - (v-min)/span * 145;
  const path = values.map((v,i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ');
  return <section className="premium-panel profit-chart">
    <div className="section-kicker"><h3>収支の推移</h3><span>選択期間 · 場代抜き（円）</span></div>
    {active ? <>
      <div className="chart-readout" aria-live="polite"><span>{new Date(active.day.date).toLocaleDateString('ja-JP')}</span><strong className={active.total >= 0 ? 'profit-positive' : 'profit-negative'}>{formatSignedYen(active.total)}</strong><small>当日 {formatSignedYen(active.day.settlement[playerId].totalWithoutFee)}</small></div>
      <svg viewBox="0 0 600 210" role="img" aria-label="場代抜きの累計収支推移。下のスライダーで日別の金額を確認できます。">
        <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#cbb079" stopOpacity=".2"/><stop offset="1" stopColor="#cbb079" stopOpacity="0"/></linearGradient></defs>
        {[35,107,180].map(v => <line key={v} x1="16" x2="584" y1={v} y2={v} stroke="#2a2e35" strokeDasharray="3 5" />)}
        <line x1="16" x2="584" y1={y(0)} y2={y(0)} stroke="#62656c" strokeDasharray="4 5" />
        <path d={`${path} L584,195 L16,195 Z`} fill={`url(#${gradientId})`} />
        <path d={path} fill="none" stroke="#d9bd82" strokeWidth="3" strokeLinejoin="round" />
        <line x1={x(activeIndex+1)} x2={x(activeIndex+1)} y1="25" y2="195" stroke="#b6a074" strokeDasharray="3 5" />
        <circle cx={x(activeIndex+1)} cy={y(active.total)} r="5" fill="#e7cb94" stroke="#13161b" strokeWidth="3" />
      </svg>
      {points.length > 1 && <input type="range" min="0" max={points.length-1} value={activeIndex} onChange={e => setSelectedId(points[Number(e.target.value)].day.id)} aria-label="収支を確認する対局日" aria-valuetext={`${new Date(active.day.date).toLocaleDateString('ja-JP')} 累計${formatSignedYen(active.total)}`} className="chart-slider" />}
      <div className="section-kicker chart-dates"><span>{new Date(points[0].day.date).toLocaleDateString('ja-JP')}</span><span>{new Date(points[points.length-1].day.date).toLocaleDateString('ja-JP')}</span></div>
    </> : <p className="muted py-6 text-sm">この期間の精算記録はありません。</p>}
  </section>;
}
