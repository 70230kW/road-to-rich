import { useMemo, useState } from 'react';
import { Award, BarChart3, Coins, Crown, Gamepad2, Gift, ListOrdered, Medal, Radar, TrendingUp } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import {
  computeCumulativeSeries,
  computeDashboardStats,
  computePlayerRateStats,
  computePlayerYakumanAchievements,
  computeRadarStats,
  computeRankCounts,
  computeRanking,
  computeYakumanAchievements,
} from '../../lib/stats';
import { filterHistoryBySeason, getAvailableSeasons, type SeasonFilter } from '../../lib/season';
import { computeRankRaceSeries } from '../../lib/rankRace';
import { computeSeasonReport } from '../../lib/seasonReport';
import { formatSignedYen } from '../../lib/format';
import { SectionHeader } from '../common/SectionHeader';
import { SeasonSelect } from '../common/SeasonSelect';
import { StatCard } from '../common/StatCard';
import { EmptyState } from '../common/EmptyState';
import { CumulativeProfitChart } from './CumulativeProfitChart';
import { RankRaceChart } from './RankRaceChart';
import { RadarChart } from './RadarChart';
import { YakumanBoard } from './YakumanBoard';
import { ActivityCalendarSection } from './ActivityCalendarSection';
import { RivalrySection } from './RivalrySection';
import { MonthlyHighlightsSection } from './MonthlyHighlightsSection';
import { MilestoneBanner } from './MilestoneBanner';
import { HallOfFameSection } from './HallOfFameSection';
import { SeasonReportModal } from './SeasonReportModal';
import { RankLevelSection } from './RankLevelSection';
import { GoalProgressSection } from './GoalProgressSection';
import { MatchmakingSection } from './MatchmakingSection';
import { PlayerDetailModal } from '../ranking/PlayerDetailModal';

export function DashboardSection() {
  const fullHistory = useAppStore((s) => s.history);
  const players = useAppStore((s) => s.players);
  const settings = useAppStore((s) => s.settings);
  const goals = useAppStore((s) => s.goals);
  const [season, setSeason] = useState<SeasonFilter>('all');
  const seasons = useMemo(() => getAvailableSeasons(fullHistory), [fullHistory]);
  const history = useMemo(() => filterHistoryBySeason(fullHistory, season), [fullHistory, season]);
  const [showReport, setShowReport] = useState(false);
  const seasonLabel = season === 'all' ? '通算' : `${season}`;
  const seasonReportData = useMemo(() => computeSeasonReport(history, players, settings), [history, players, settings]);

  const seasonSelect = (
    <div className="flex items-center gap-2">
      <SeasonSelect season={season} onChange={setSeason} seasons={seasons} accent="cyan" />
      <button
        type="button"
        onClick={() => setShowReport(true)}
        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/30 hover:bg-fuchsia-500/20 transition-colors whitespace-nowrap"
      >
        <Gift className="w-3.5 h-3.5" /> シーズンレポート
      </button>
    </div>
  );

  const stats = useMemo(() => computeDashboardStats(history, players), [history, players]);
  const series = useMemo(() => computeCumulativeSeries(history, players), [history, players]);
  const rankRaceSeries = useMemo(() => computeRankRaceSeries(history, players), [history, players]);
  const radarRows = useMemo(() => computeRadarStats(history, players), [history, players]);
  const yakumanAchievements = useMemo(() => computeYakumanAchievements(history, players), [history, players]);

  const rankingRows = useMemo(() => computeRanking(history, players), [history, players]);
  const rankCounts = useMemo(() => computeRankCounts(history, players), [history, players]);
  const playerYakumanAchievements = useMemo(() => computePlayerYakumanAchievements(history, players), [history, players]);
  const rateStats = useMemo(() => computePlayerRateStats(history, players), [history, players]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const selectedIdx = rankingRows.findIndex((r) => r.playerId === selectedPlayerId);
  const selectedRow = selectedIdx >= 0 ? rankingRows[selectedIdx] : null;
  const selectedRadarRow = radarRows.find((r) => r.playerId === selectedPlayerId) ?? null;

  if (history.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader icon={BarChart3} title="ダッシュボード" accent="cyan" trailing={fullHistory.length > 0 ? seasonSelect : undefined} />
        {fullHistory.length > 0 && <MilestoneBanner history={fullHistory} players={players} />}
        {fullHistory.length > 0 && <MonthlyHighlightsSection history={fullHistory} players={players} />}
        {fullHistory.length > 0 && <GoalProgressSection history={fullHistory} players={players} goals={goals} />}
        {fullHistory.length > 0 && <RankLevelSection history={fullHistory} players={players} settings={settings} />}
        <EmptyState icon={BarChart3} message="No Data" hint="対局を記録して精算を保存すると、ここに統計が表示されます。" />
        {showReport && (
          <SeasonReportModal seasonLabel={seasonLabel} data={seasonReportData} players={players} onClose={() => setShowReport(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeader icon={BarChart3} title="ダッシュボード" accent="cyan" trailing={seasonSelect} />

      <MilestoneBanner history={fullHistory} players={players} />

      <MonthlyHighlightsSection history={fullHistory} players={players} />

      <GoalProgressSection history={fullHistory} players={players} goals={goals} />

      <RankLevelSection history={fullHistory} players={players} settings={settings} />

      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
        <StatCard
          title="参加半荘数1位"
          value={stats.mostHanchansPlayed ? `${stats.mostHanchansPlayed.value} GAMES` : '-'}
          sub={stats.mostHanchansPlayed?.playerName}
          icon={<Gamepad2 />}
          color="cyan"
          onClick={stats.mostHanchansPlayed ? () => setSelectedPlayerId(stats.mostHanchansPlayed!.playerId) : undefined}
        />
        <StatCard
          title="1日平均勝ち額"
          value={stats.bestAvgDailyWin ? formatSignedYen(Math.round(stats.bestAvgDailyWin.value)) : '-'}
          sub={stats.bestAvgDailyWin?.playerName}
          icon={<TrendingUp />}
          color="fuchsia"
          onClick={stats.bestAvgDailyWin ? () => setSelectedPlayerId(stats.bestAvgDailyWin!.playerId) : undefined}
        />
        <StatCard
          title="平均着順1位"
          value={stats.bestAvgRank ? `${stats.bestAvgRank.value.toFixed(2)}位` : '-'}
          sub={stats.bestAvgRank?.playerName}
          icon={<Medal />}
          color="indigo"
          onClick={stats.bestAvgRank ? () => setSelectedPlayerId(stats.bestAvgRank!.playerId) : undefined}
        />
        <StatCard
          title="1半荘最高素点"
          value={stats.highestScore ? stats.highestScore.value.toLocaleString() : '-'}
          sub={stats.highestScore?.playerName}
          icon={<Award />}
          color="yellow"
          onClick={stats.highestScore ? () => setSelectedPlayerId(stats.highestScore!.playerId) : undefined}
        />
        <StatCard
          title="1日最高勝利"
          value={stats.bestDailyWin ? formatSignedYen(stats.bestDailyWin.value) : '-'}
          sub={stats.bestDailyWin?.playerName}
          icon={<Crown />}
          color="emerald"
          onClick={stats.bestDailyWin ? () => setSelectedPlayerId(stats.bestDailyWin!.playerId) : undefined}
        />
        <StatCard
          title="1日最高チップ"
          value={stats.bestDailyChips ? `${stats.bestDailyChips.value > 0 ? '+' : ''}${stats.bestDailyChips.value}枚` : '-'}
          sub={stats.bestDailyChips?.playerName}
          icon={<Coins />}
          color="rose"
          onClick={stats.bestDailyChips ? () => setSelectedPlayerId(stats.bestDailyChips!.playerId) : undefined}
        />
      </div>

      <div className="bg-panel-2/80 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden group hover:border-cyan-800/80 transition-colors duration-500 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <h3 className="text-sm font-black text-cyan-400 mb-8 flex items-center tracking-[0.2em] uppercase">
          <TrendingUp className="w-5 h-5 mr-2" /> 累計収支推移
          <span className="text-slate-500 ml-2 font-normal text-xs normal-case">(Cumulative Profit)</span>
        </h3>
        <CumulativeProfitChart series={series} />
      </div>

      {rankRaceSeries.activePlayers.length > 0 && (
        <div className="bg-panel-2/80 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden group hover:border-fuchsia-800/80 transition-colors duration-500 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
          <h3 className="text-sm font-black text-fuchsia-400 mb-8 flex items-center tracking-[0.2em] uppercase">
            <ListOrdered className="w-5 h-5 mr-2" /> 順位レース
            <span className="text-slate-500 ml-2 font-normal text-xs normal-case">(Rank Race)</span>
          </h3>
          <RankRaceChart series={rankRaceSeries} />
        </div>
      )}

      {radarRows.length > 0 && (
        <div className="bg-panel-2/80 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden group hover:border-cyan-800/80 transition-colors duration-500 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
          <h3 className="text-sm font-black text-cyan-400 mb-8 flex items-center tracking-[0.2em] uppercase">
            <Radar className="w-5 h-5 mr-2" /> 能力レーダー
            <span className="text-slate-500 ml-2 font-normal text-xs normal-case">(平均着順は良いほど外側)</span>
          </h3>
          <RadarChart rows={radarRows} />
        </div>
      )}

      <ActivityCalendarSection history={history} players={players} />

      <RivalrySection history={history} players={players} />

      <MatchmakingSection history={history} players={players} />

      <HallOfFameSection history={history} players={players} />

      <YakumanBoard achievements={yakumanAchievements} />

      {selectedRow && (
        <PlayerDetailModal
          row={selectedRow}
          radarRow={selectedRadarRow}
          rankCounts={selectedPlayerId ? (rankCounts[selectedPlayerId] ?? []) : []}
          yakumanAchievements={selectedPlayerId ? (playerYakumanAchievements[selectedPlayerId] ?? []) : []}
          rateStats={
            (selectedPlayerId ? rateStats[selectedPlayerId] : undefined) ?? {
              topRate: null,
              rentaiRate: null,
              lastRate: null,
              tobiRate: null,
            }
          }
          rank={selectedIdx + 1}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}

      {showReport && (
        <SeasonReportModal seasonLabel={seasonLabel} data={seasonReportData} players={players} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
}
