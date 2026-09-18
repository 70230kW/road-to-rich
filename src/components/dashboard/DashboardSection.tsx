import { lazy, Suspense, useMemo, useState } from 'react';
import { BarChart3, ArrowUpRight, ChevronDown, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { computeRanking, computePlayerRateStats } from '../../lib/stats';
import { computePlayerRankStatuses } from '../../lib/rankLevel';
import { filterHistoryBySeason, getAvailableSeasons, formatSeasonLabel, type SeasonFilter } from '../../lib/season';
import { formatSignedYen } from '../../lib/format';
import { SectionHeader } from '../common/SectionHeader';
import { SeasonSelect } from '../common/SeasonSelect';
import { EmptyState } from '../common/EmptyState';
import { PlayerSelect } from '../common/PlayerSelect';
import { PersonalProfitChart } from './PersonalProfitChart';
const LeagueAnalysis = lazy(() => import('./LeagueAnalysis').then(m => ({ default: m.LeagueAnalysis })));

export function DashboardSection() {
  const history = useAppStore(s => s.history);
  const players = useAppStore(s => s.players);
  const [season, setSeason] = useState<SeasonFilter>('all');
  const [playerId, setPlayerId] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const activeId = players.some(p => p.id === playerId) ? playerId : players[0]?.id ?? '';
  const filtered = useMemo(() => filterHistoryBySeason(history, season), [history, season]);
  const rows = useMemo(() => computeRanking(filtered, players), [filtered, players]);
  const rates = useMemo(() => computePlayerRateStats(filtered, players), [filtered, players]);
  const statuses = useMemo(() => computePlayerRankStatuses(history, players), [history, players]);
  const row = rows.find(r => r.playerId === activeId);
  const rate = rates[activeId];
  const status = statuses[activeId];
  const games = useMemo(() => [...filtered].sort((a,b) => Date.parse(a.date)-Date.parse(b.date))
    .flatMap(day => day.games.flatMap((game, index) => {
      const score = game.scores.find(s => s.playerId === activeId);
      return score ? [{ ...score, id: game.id, date: day.date, number: index + 1 }] : [];
    })), [filtered, activeId]);
  const recent = games.slice(-10);
  const previous = games.slice(-20, -10);
  const topRateChange = recent.length === 10 && previous.length === 10
    ? (recent.filter(g => g.rank === 1).length - previous.filter(g => g.rank === 1).length) * 10 : null;
  const percent = (n: number | null | undefined) => n == null ? '—' : `${(n * 100).toFixed(1)}%`;

  return <div className="space-y-7 animate-fade-in">
    <SectionHeader icon={BarChart3} title="ダッシュボード" trailing={<SeasonSelect season={season} onChange={setSeason} seasons={getAvailableSeasons(history)} />} />
    {players.length === 0 ? <EmptyState icon={BarChart3} message="最初の一戦から、キャリアが始まる。" hint="雀士を登録し、対局を記録すると個人成績が表示されます。" /> : <>
      <PlayerSelect players={players} value={activeId} onChange={setPlayerId} />
      <section className="performance-hero">
        <div className="section-kicker"><span className="eyebrow">YOUR PERFORMANCE</span><span>{formatSeasonLabel(season)}</span></div>
        <p className="hero-label">{season === 'all' ? '累計収支' : '期間収支'} <span>場代抜き・円</span></p>
        <p className={`hero-number ${(row?.totalProfitWithoutFee ?? 0) >= 0 ? 'profit-positive' : 'profit-negative'}`}>{row ? formatSignedYen(row.totalProfitWithoutFee) : '—'}</p>
        <p className="muted text-xs">場代込み {row ? formatSignedYen(row.totalProfitWithFee) : '—'} · {row?.dayCount ?? 0}日間の記録</p>
        {status && <div className="hero-rank"><div><strong className="text-gold">{status.levelName}</strong><span>通算段位</span></div>
          <progress className="rank-progress" value={status.progressRatio} max={1} aria-label="次の段位への進捗" />
          <small>{status.nextLevelName ? `${status.nextLevelName}まであと ¥${status.profitToNextLevel!.toLocaleString()}` : '最高段位に到達'}</small>
        </div>}
      </section>
      <div className="kpi-grid">
        {[['平均順位', row?.avgRank?.toFixed(2) ?? '—'], ['トップ率', percent(rate?.topRate)], ['ラス率', percent(rate?.lastRate)], ['半荘数', String(row?.hanchanCount ?? 0)]].map(([label, value]) => <div key={label} className="kpi"><span>{label}</span><strong>{value}</strong></div>)}
      </div>
      {row ? <>
        <PersonalProfitChart history={filtered} playerId={activeId} />
        <section className="premium-panel"><div className="section-kicker"><h3>直近の対局</h3><span>最新5半荘 · チップ・場代除く（円）</span></div>
          {games.slice(-5).reverse().map(game => <div key={game.id} className="recent-row"><span className={`placement placement-${game.rank}`}>{game.rank}<small>位</small></span><div><strong>第{game.number}半荘</strong><small>{new Date(game.date).toLocaleDateString('ja-JP')}</small></div><strong className={`ml-auto font-mono ${game.point >= 0 ? 'profit-positive' : 'profit-negative'}`}>{formatSignedYen(game.point)}</strong></div>)}
          {games.length === 0 && <p className="muted text-sm py-5">この期間の半荘記録はありません。</p>}
        </section>
        <section className="insight-panel"><Sparkles size={19} className="text-gold shrink-0" /><div><p className="eyebrow mb-2">PERFORMANCE NOTE</p><p>{topRateChange !== null ? `直近10半荘のトップ率は、その前の10半荘と比べて${topRateChange > 0 ? '+' : ''}${topRateChange}ポイント${topRateChange === 0 ? 'で変化なしです。' : '変化しています。'}` : `この期間に${games.length}半荘を記録。20半荘以上になると、直近のトップ率の変化を比較できます。`}</p></div><ArrowUpRight size={18} className="text-gold shrink-0" /></section>
      </> : <EmptyState icon={BarChart3} message="この期間の成績はありません" hint="期間または雀士を切り替えると、ほかの記録を確認できます。" />}
    </>}
    <button type="button" className="details-toggle" aria-expanded={showDetails} aria-controls="league-analysis" onClick={() => setShowDetails(!showDetails)}>リーグ全体の分析 {showDetails ? 'を閉じる' : 'を見る'}<ChevronDown size={18} className={showDetails ? 'rotate-180' : ''} /></button>
    {showDetails && <div id="league-analysis"><Suspense fallback={<p className="muted">分析を読み込み中…</p>}><LeagueAnalysis season={season} /></Suspense></div>}
  </div>;
}
