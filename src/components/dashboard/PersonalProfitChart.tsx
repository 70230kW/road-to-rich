import { useId, useMemo, useState } from 'react';
import type { DayRecord } from '../../types';
import { formatSignedYen } from '../../lib/format';

export function PersonalProfitChart({ history, playerId }: { history: DayRecord[]; playerId: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const gradientId = useId();
  const points = useMemo(() => {
    let total = 0;
    return [...history].sort((a,b) => Date.parse(a.date)-Date.parse(b.date)).filter(day => day.settlement[playerId]).map(day => {
      total += day.settlement[playerId].totalWithoutFee;
      return { day, total };
    });
  }, [history, playerId]);
  const foundIndex = points.findIndex(point => point.day.id === selectedId);
  const activeIndex = foundIndex < 0 ? points.length - 1 : foundIndex;
  const active = points[activeIndex];
  const values = [0, ...points.map(point => point.total)];
  const low = Math.min(...values), high = Math.max(...values);
  const min = low === high ? -1000 : low, max = low === high ? 1000 : high;
  const x = (index: number) => 100 + index / Math.max(1, values.length - 1) * 480;
  const y = (value: number) => 190 - (value-min)/(max-min) * 160;
  const path = values.map((value,index) => `${index === 0 ? 'M' : 'L'}${x(index)},${y(value)}`).join(' ');
  const ticks = [...new Set([min, (min + max) / 2, max, 0])].sort((a,b) => a-b);
  const axisLabel = (value: number) => Math.abs(value) >= 10000 ? `${Number((value / 10000).toFixed(1))}万` : Math.round(value).toLocaleString('ja-JP');
  const pointLabel = (index: number) => {
    const point = points[index];
    return `${new Date(point.day.date).toLocaleDateString('ja-JP')} ${point.day.session?.title ?? '通常対局'} 選択期間の累計${formatSignedYen(point.total)}円`;
  };
  return <section className="premium-panel profit-chart">
    <div className="section-kicker"><h3>収支の推移</h3><span>選択期間の累計 · 場代抜き（円）</span></div>
    {active ? <>
      <div className="chart-readout" aria-live="polite"><span>{new Date(active.day.date).toLocaleDateString('ja-JP')} {active.day.session?.title ?? '通常対局'}</span><strong className={active.total >= 0 ? 'profit-positive' : 'profit-negative'}><small>選択期間の累計</small>{formatSignedYen(active.total)}円</strong><small>この対局の収支 {formatSignedYen(active.day.settlement[playerId].totalWithoutFee)}円</small></div>
      <svg viewBox="0 0 600 220" role="img" aria-label="選択期間の累計収支。ゼロ線と金額目盛りを表示。グラフをタップ、または下のスライダーで各対局の値を確認できます。" onPointerDown={event => {
        const rect = event.currentTarget.getBoundingClientRect();
        const relative = (event.clientX - rect.left) / rect.width * 600;
        const index = Math.max(0, Math.min(points.length - 1, Math.round((relative - 100) / 480 * points.length) - 1));
        setSelectedId(points[index].day.id);
      }}>
        <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#cbb079" stopOpacity=".2"/><stop offset="1" stopColor="#cbb079" stopOpacity="0"/></linearGradient></defs>
        <path d={`${path} L580,${y(0)} L100,${y(0)} Z`} fill={`url(#${gradientId})`} />
        {ticks.map(value => <g key={value}><line x1="100" x2="580" y1={y(value)} y2={y(value)} stroke={value === 0 ? '#a5b5bb' : '#313b43'} strokeWidth={value === 0 ? 2 : 1} strokeDasharray={value === 0 ? undefined : '3 5'} /><text className="chart-axis" x="86" y={y(value)} dominantBaseline="middle" textAnchor="end" fill={value === 0 ? '#e0e8eb' : '#a5b5bb'}>{axisLabel(value)}</text></g>)}
        <path d={path} fill="none" stroke="#d9bd82" strokeWidth="3" strokeLinejoin="round" />
        <line x1={x(activeIndex+1)} x2={x(activeIndex+1)} y1="25" y2="195" stroke="#b6a074" strokeDasharray="3 5" />
        <circle cx={x(activeIndex+1)} cy={y(active.total)} r="5" fill="#e7cb94" stroke="#13161b" strokeWidth="3" />
      </svg>
      {points.length > 1 && <input type="range" min="0" max={points.length-1} value={activeIndex} onChange={event => setSelectedId(points[Number(event.target.value)].day.id)} aria-label="収支を確認する対局日" aria-valuetext={pointLabel(activeIndex)} className="chart-slider" />}
      <div className="section-kicker chart-dates"><span>{new Date(points[0].day.date).toLocaleDateString('ja-JP')}</span><span>{new Date(points[points.length-1].day.date).toLocaleDateString('ja-JP')}</span></div>
    </> : <p className="muted py-6 text-sm">この期間の精算記録はありません。</p>}
  </section>;
}
