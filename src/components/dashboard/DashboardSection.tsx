import { updateRouteQuery, useAppRoute } from '../../store/useNavigation';
import { useViewContext } from '../../store/useViewPreferences';
import { RankEmblem } from '../common/RankEmblem';
import { lazy, Suspense, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { computeRanking, computePlayerRateStats } from '../../lib/stats';
import { computePlayerRankStatuses } from '../../lib/rankLevel';
import { filterHistoryBySeason, formatSeasonLabel } from '../../lib/season';
import { formatRatePercentage, formatSignedYen } from '../../lib/format';
import { SectionHeader } from '../common/SectionHeader';
import { PeriodFilter } from '../common/PeriodFilter';
import { EmptyState } from '../common/EmptyState';
import { PersonalProfitChart } from './PersonalProfitChart';
import { ScrambleText } from '../common/ScrambleText';
import { TabSkeleton } from '../common/TabSkeleton';
import { RecentTrends } from './RecentTrends';
const LeagueAnalysis = lazy(() => import('./LeagueAnalysis').then(m => ({ default: m.LeagueAnalysis })));

export function DashboardSection() {
  const history = useAppStore(s => s.history);
  const players = useAppStore(s => s.players);
  const { season, activeId, setPeriod } = useViewContext();
  const route = useAppRoute();
  const scope = route.params.get('tab') === 'league' ? 'league' : 'personal';
  const setScope = (tab: string) => updateRouteQuery({ tab });
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

  return <div className="space-y-7 animate-fade-in">
    <SectionHeader icon={BarChart3} title="ダッシュボード" />
    <div className="scope-switch" role="group" aria-label="ダッシュボードの表示対象"><button type="button" aria-pressed={scope === 'personal'} onClick={() => setScope('personal')}>個人成績</button><button type="button" aria-pressed={scope === 'league'} onClick={() => setScope('league')}>リーグ全体</button></div>
    <PeriodFilter />
    <p className="scope-caption">{scope === 'personal' ? players.find(p => p.id === activeId)?.name ?? '個人' : 'リーグ全員'}の成績 · {formatSeasonLabel(season)}</p>
    {scope === 'league' ? <Suspense fallback={<TabSkeleton tab="dashboard" compact label="リーグ分析を読み込み中" />}><LeagueAnalysis season={season} /></Suspense> : players.length === 0 ? <EmptyState icon={BarChart3} message="最初の一戦から、キャリアが始まる。" hint="雀士を登録し、対局を記録すると個人成績が表示されます。" /> : games.length === 0 ? <section className="period-empty">
      <EmptyState icon={BarChart3} message="この期間の成績はありません" hint="選択中の雀士が参加した半荘は0件です。期間を切り替えてご確認ください。" />
      {season !== 'all' && <button type="button" className="action-primary" onClick={() => setPeriod('all')}>通算を見る</button>}
      {status && <p className="scope-caption">通算段位：{status.levelName}（期間フィルターの対象外）</p>}
    </section> : <>
      <section className="performance-hero player-career-card">
        <div className="career-card-heading">{status && <RankEmblem status={status} compact />}<div><p className="eyebrow">PLAYER PROFILE</p><h3>{players.find(p => p.id === activeId)?.name}</h3></div><span className="text-gold">通算 {status?.levelName}</span></div>
        <div className="section-kicker"><span className="eyebrow">YOUR PERFORMANCE</span><span>{formatSeasonLabel(season)}</span></div>
        <p className="hero-label">{season === 'all' ? '累計収支' : '期間収支'} <span>場代抜き・円</span></p>
        <p className={`hero-number ${(row?.totalProfitWithoutFee ?? 0) >= 0 ? 'profit-positive' : 'profit-negative'}`}><ScrambleText text={row ? formatSignedYen(row.totalProfitWithoutFee) : '—'} /></p>
        <p className="muted text-xs">場代込み <ScrambleText text={row ? formatSignedYen(row.totalProfitWithFee) : '—'} /> · <ScrambleText text={String(row?.dayCount ?? 0)} />日間の記録</p>
        <div className="recent-form"><span>直近5戦</span>{games.slice(-5).map(game => <span key={game.id} className={`placement placement-${game.rank}`} title={`${new Date(game.date).toLocaleDateString('ja-JP')} 第${game.number}半荘`}>{game.rank}<span className="sr-only">位</span></span>)}{games.length === 0 && <small>記録待ち</small>}<small>古い → 新しい</small></div>
      </section>
      <div className="kpi-grid">
        {[['平均順位', row?.avgRank?.toFixed(2) ?? '—'], ['トップ率', formatRatePercentage(rate?.topRate)], ['ラス率', formatRatePercentage(rate?.lastRate)], ['半荘数', String(row?.hanchanCount ?? 0)]].map(([label, value]) => <div key={label} className="kpi"><span>{label}</span><strong><ScrambleText text={value} /></strong></div>)}
      </div>
      {status && <section className="rank-progress-card"><div><span className="eyebrow">通算段位</span><strong className="text-gold">{status.levelName}</strong></div><small>期間フィルターの対象外</small>
        <progress className="rank-progress" value={status.progressRatio} max={1} aria-label="次の段位への進捗" />
        <small>{status.nextLevelName ? <>{status.nextLevelName}まであと <ScrambleText text={`¥${status.profitToNextLevel!.toLocaleString()}`} /></> : '最高段位に到達'}</small>
      </section>}
      {row ? <div className="dashboard-columns">
        <div className="dashboard-main"><PersonalProfitChart history={filtered} playerId={activeId} /></div>
        <aside className="dashboard-side">
        <section className="premium-panel"><div className="section-kicker"><h3>直近の対局</h3><span>最新5半荘 · チップ・場代除く（円）</span></div>
          {games.slice(-5).reverse().map(game => <div key={game.id} className="recent-row"><span className={`placement placement-${game.rank}`}>{game.rank}<small>位</small></span><div><strong>第{game.number}半荘</strong><small>{new Date(game.date).toLocaleDateString('ja-JP')}</small></div><strong className={`ml-auto font-mono ${game.point >= 0 ? 'profit-positive' : 'profit-negative'}`}>{formatSignedYen(game.point)}</strong></div>)}
          {games.length === 0 && <p className="muted text-sm py-5">この期間の半荘記録はありません。</p>}
        </section>
        </aside>
      </div> : <EmptyState icon={BarChart3} message="この期間の成績はありません" hint="期間または雀士を切り替えると、ほかの記録を確認できます。" />}
      <RecentTrends history={filtered} playerId={activeId} periodLabel={formatSeasonLabel(season)} />
    </>}
  </div>;
}
