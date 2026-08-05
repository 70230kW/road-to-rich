import { useMemo } from 'react';
import { Award, BarChart3, Coins, Crown, Gamepad2, Medal, Radar, TrendingUp, Zap } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { computeCumulativeSeries, computeDashboardStats, computeRadarStats } from '../../lib/stats';
import { formatSignedYen } from '../../lib/format';
import { SectionHeader } from '../common/SectionHeader';
import { StatCard } from '../common/StatCard';
import { EmptyState } from '../common/EmptyState';
import { CumulativeProfitChart } from './CumulativeProfitChart';
import { RadarChart } from './RadarChart';

export function DashboardSection() {
  const history = useAppStore((s) => s.history);
  const players = useAppStore((s) => s.players);

  const stats = useMemo(() => computeDashboardStats(history, players), [history, players]);
  const series = useMemo(() => computeCumulativeSeries(history, players), [history, players]);
  const radarRows = useMemo(() => computeRadarStats(history, players), [history, players]);

  if (history.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader icon={BarChart3} title="ダッシュボード" accent="cyan" />
        <EmptyState icon={BarChart3} message="No Data" hint="対局を記録して精算を保存すると、ここに統計が表示されます。" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeader icon={BarChart3} title="ダッシュボード" accent="cyan" />

      <div className="grid grid-cols-6 gap-1.5 sm:gap-4 md:gap-6">
        <StatCard title="総稼働日数" value={`${stats.totalDays} DAYS`} icon={<Zap />} color="cyan" />
        <StatCard title="総半荘数" value={`${stats.totalGames} GAMES`} icon={<Gamepad2 />} color="fuchsia" />
        <StatCard
          title="最高素点"
          value={stats.highestScore ? stats.highestScore.value.toLocaleString() : '-'}
          sub={stats.highestScore?.playerName}
          icon={<Award />}
          color="yellow"
        />
        <StatCard
          title="1日最高勝利"
          value={stats.bestDailyWin ? formatSignedYen(stats.bestDailyWin.value) : '-'}
          sub={stats.bestDailyWin?.playerName}
          icon={<Crown />}
          color="emerald"
        />
        <StatCard
          title="平均着順1位"
          value={stats.bestAvgRank ? `${stats.bestAvgRank.value.toFixed(2)}位` : '-'}
          sub={stats.bestAvgRank?.playerName}
          icon={<Medal />}
          color="indigo"
        />
        <StatCard
          title="1日最高チップ"
          value={stats.bestDailyChips ? `${stats.bestDailyChips.value > 0 ? '+' : ''}${stats.bestDailyChips.value}枚` : '-'}
          sub={stats.bestDailyChips?.playerName}
          icon={<Coins />}
          color="rose"
        />
      </div>

      <div className="bg-panel-2/80 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden group hover:border-cyan-800/80 transition-colors duration-500 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <h3 className="text-sm font-black text-cyan-400 mb-8 flex items-center tracking-[0.2em] uppercase">
          <TrendingUp className="w-5 h-5 mr-2" /> 累計収支推移
          <span className="text-slate-500 ml-2 font-normal text-xs normal-case">(Cumulative Profit)</span>
        </h3>
        <CumulativeProfitChart series={series} />
      </div>

      {radarRows.length > 0 && (
        <div className="bg-panel-2/80 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden group hover:border-cyan-800/80 transition-colors duration-500 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
          <h3 className="text-sm font-black text-cyan-400 mb-8 flex items-center tracking-[0.2em] uppercase">
            <Radar className="w-5 h-5 mr-2" /> 能力レーダー
            <span className="text-slate-500 ml-2 font-normal text-xs normal-case">(平均着順は良いほど外側)</span>
          </h3>
          <RadarChart rows={radarRows} />
        </div>
      )}
    </div>
  );
}
