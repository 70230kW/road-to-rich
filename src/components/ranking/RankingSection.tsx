import { useMemo, useState } from 'react';
import { Crown, Gamepad2, TrendingUp, Zap } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import {
  computePlayerRateStats,
  computePlayerYakumanAchievements,
  computeRadarStats,
  computeRankCounts,
  computeRanking,
} from '../../lib/stats';
import { filterHistoryBySeason, getAvailableSeasons, type SeasonFilter } from '../../lib/season';
import { computePlayerTitles } from '../../lib/titles';
import { computePlayerRankStatuses } from '../../lib/rankLevel';
import { formatSignedYen } from '../../lib/format';
import { SectionHeader } from '../common/SectionHeader';
import { SeasonSelect } from '../common/SeasonSelect';
import { EmptyState } from '../common/EmptyState';
import { TitleBadge } from '../common/TitleBadge';
import { RankBadge } from '../common/RankBadge';
import { PlayerDetailModal } from './PlayerDetailModal';

const RANK_STYLES = [
  {
    text: 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]',
    border: 'border-yellow-500/40 bg-yellow-950/10',
    glow: 'shadow-[0_0_30px_rgba(250,204,21,0.15)]',
    bar: 'bg-gradient-to-b from-yellow-400 to-amber-600',
  },
  {
    text: 'text-slate-300 drop-shadow-[0_0_10px_rgba(203,213,225,0.8)]',
    border: 'border-slate-400/40 bg-slate-900/40',
    glow: '',
    bar: 'bg-gradient-to-b from-slate-300 to-slate-500',
  },
  {
    text: 'text-amber-600 drop-shadow-[0_0_10px_rgba(217,119,6,0.8)]',
    border: 'border-amber-700/40 bg-amber-950/10',
    glow: '',
    bar: 'bg-gradient-to-b from-amber-600 to-amber-800',
  },
];

export function RankingSection() {
  const fullHistory = useAppStore((s) => s.history);
  const players = useAppStore((s) => s.players);
  const settings = useAppStore((s) => s.settings);
  const [season, setSeason] = useState<SeasonFilter>('all');
  const seasons = useMemo(() => getAvailableSeasons(fullHistory), [fullHistory]);
  const history = useMemo(() => filterHistoryBySeason(fullHistory, season), [fullHistory, season]);

  const rows = useMemo(() => computeRanking(history, players), [history, players]);
  const radarRows = useMemo(() => computeRadarStats(history, players), [history, players]);
  const rankCounts = useMemo(() => computeRankCounts(history, players), [history, players]);
  const yakumanAchievements = useMemo(() => computePlayerYakumanAchievements(history, players), [history, players]);
  const rateStats = useMemo(() => computePlayerRateStats(history, players), [history, players]);
  const titles = useMemo(() => computePlayerTitles(history, players), [history, players]);
  // 段位は季節に関係なく、通算の累計ptで判定する（一時的な絞り込みで昇段・降段して見えないように）。
  const rankStatuses = useMemo(() => computePlayerRankStatuses(fullHistory, players, settings), [fullHistory, players, settings]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const seasonSelect = <SeasonSelect season={season} onChange={setSeason} seasons={seasons} accent="yellow" />;

  if (rows.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader icon={Crown} title="総合ランキング" accent="yellow" trailing={seasonSelect} />
        <EmptyState icon={Crown} message="No Ranking Data" hint="精算を保存すると、雀士ごとの累計成績が表示されます。" />
      </div>
    );
  }

  const selectedIdx = rows.findIndex((r) => r.playerId === selectedPlayerId);
  const selectedRow = selectedIdx >= 0 ? rows[selectedIdx] : null;
  const selectedRadarRow = radarRows.find((r) => r.playerId === selectedPlayerId) ?? null;

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeader icon={Crown} title="総合ランキング" accent="yellow" trailing={seasonSelect} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] sm:text-xs text-slate-500 font-mono font-bold px-1">
        <span className="flex items-center">
          <Gamepad2 className="w-3 h-3 mr-1.5 text-cyan-500" /> 半荘数
        </span>
        <span className="flex items-center">
          <TrendingUp className="w-3 h-3 mr-1.5 text-fuchsia-500" /> 平均着順
        </span>
        <span className="flex items-center">
          <Zap className="w-3 h-3 mr-1.5 text-yellow-500" /> 平均チップ（1日あたり）
        </span>
      </div>

      <div className="space-y-3 sm:space-y-5">
        {rows.map((row, idx) => {
          const style = RANK_STYLES[idx] ?? { text: 'text-slate-600', border: 'border-slate-800/80', glow: '', bar: 'bg-slate-800' };
          return (
            <button
              type="button"
              key={row.playerId}
              onClick={() => setSelectedPlayerId(row.playerId)}
              className={`w-full text-left bg-panel-2/70 p-3 sm:p-5 rounded-2xl sm:rounded-[2rem] border ${style.border} ${style.glow} flex items-center gap-2 sm:gap-4 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300 backdrop-blur-md cursor-pointer`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 sm:w-2 transition-colors ${style.bar}`} />

              <div
                className={`shrink-0 w-7 sm:w-16 md:w-20 text-center font-black text-base sm:text-3xl md:text-4xl italic ${style.text} font-mono tracking-tighter`}
              >
                #{idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-black text-xs sm:text-xl md:text-2xl text-slate-100 tracking-wide truncate">{row.name}</div>
                  {rankStatuses[row.playerId] && <RankBadge status={rankStatuses[row.playerId]!} />}
                  {titles[row.playerId] && <TitleBadge title={titles[row.playerId]!} />}
                </div>
                <div className="flex items-center gap-1 sm:gap-2 md:gap-3 text-[9px] sm:text-xs text-slate-400 font-mono font-bold mt-1 sm:mt-2">
                  <span className="flex items-center bg-abyss px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg border border-slate-800 shrink-0">
                    <Gamepad2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-1.5 text-cyan-500" />
                    <span className="text-slate-200">{row.hanchanCount}</span>
                  </span>
                  <span className="flex items-center bg-abyss px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg border border-slate-800 shrink-0">
                    <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-1.5 text-fuchsia-500" />
                    <span className="text-slate-200">{row.avgRank !== null ? row.avgRank.toFixed(2) : '-'}</span>
                  </span>
                  <span className="flex items-center bg-abyss px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg border border-slate-800 shrink-0">
                    <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-1.5 text-yellow-500" />
                    <span className={(row.avgChips ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {row.avgChips !== null ? `${row.avgChips > 0 ? '+' : ''}${row.avgChips.toFixed(2)}` : '-'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[7px] sm:text-[10px] font-black text-slate-500 tracking-[0.15em] sm:tracking-[0.2em] uppercase">
                  Total Profit
                </div>
                <div
                  className={`font-mono text-sm sm:text-2xl md:text-4xl font-black ${
                    row.totalProfitWithoutFee >= 0
                      ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]'
                      : 'text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                  }`}
                >
                  {formatSignedYen(row.totalProfitWithoutFee)}
                </div>
                <div className="text-[7px] sm:text-[10px] text-slate-500 font-mono mt-0.5">
                  場代込み {formatSignedYen(row.totalProfitWithFee)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedRow && (
        <PlayerDetailModal
          row={selectedRow}
          radarRow={selectedRadarRow}
          rankCounts={selectedPlayerId ? (rankCounts[selectedPlayerId] ?? []) : []}
          yakumanAchievements={selectedPlayerId ? (yakumanAchievements[selectedPlayerId] ?? []) : []}
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
    </div>
  );
}
