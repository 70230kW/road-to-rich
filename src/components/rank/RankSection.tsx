import { useMemo, useState } from 'react';
import { ChevronDown, Gauge, Users } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { computePlayerRankStatuses, groupRankTiers, type RankGroup } from '../../lib/rankLevel';
import { RANK_GROUP_THEME } from '../common/RankBadge';
import { formatSignedYen } from '../../lib/format';
import { SectionHeader } from '../common/SectionHeader';
import { EmptyState } from '../common/EmptyState';

export function RankSection() {
  const players = useAppStore((s) => s.players);
  const history = useAppStore((s) => s.history);
  const statuses = useMemo(() => computePlayerRankStatuses(history, players), [history, players]);
  const groups = useMemo(() => groupRankTiers(), []);
  const [expandedGroups, setExpandedGroups] = useState<Set<RankGroup>>(new Set());

  const toggleGroup = (group: RankGroup) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const rankedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const sa = statuses[a.id];
      const sb = statuses[b.id];
      if (!sa || !sb) return 0;
      if (sb.levelIndex !== sa.levelIndex) return sb.levelIndex - sa.levelIndex;
      return sb.cumulativeProfit - sa.cumulativeProfit;
    });
  }, [players, statuses]);

  const scrollToTierList = () => {
    document.getElementById('rank-tier-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (players.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader icon={Gauge} title="段位" accent="cyan" />
        <EmptyState icon={Users} message="No Players" hint="「雀士登録」タブで雀士を登録すると、段位が表示されます。" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeader icon={Gauge} title="段位" accent="cyan" />
      <p className="text-xs text-slate-500 -mt-4">
        ※ 段位はポイント変換をせず、実際に勝った金額（場代抜きの累計収支、総合ランキングと同じ基準）で判定します。シーズンに関係なく通算の成績で決まり、負けが¥15,000を超えると「地底人」になります。
        <button
          type="button"
          onClick={scrollToTierList}
          className="ml-1 font-bold text-cyan-400 underline underline-offset-2 hover:text-cyan-300"
        >
          各段位の達成条件はこちら
        </button>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rankedPlayers.map((p) => {
          const status = statuses[p.id];
          if (!status) return null;
          const theme = RANK_GROUP_THEME[status.group];
          return (
            <div key={p.id} className="bg-panel-2/70 p-5 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-black text-slate-100 text-lg truncate">{p.name}</span>
                <span className={`font-mono text-lg font-black shrink-0 ${theme.text}`}>{status.levelName}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${theme.bar} transition-all`}
                  style={{ width: `${status.progressRatio * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-2">
                <span>累計収支 {formatSignedYen(status.cumulativeProfit)}</span>
                <span>
                  {status.nextLevelName
                    ? `次の${status.nextLevelName}まであと ${formatSignedYen(status.profitToNextLevel!)}`
                    : '最高段位に到達！'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        id="rank-tier-list"
        className="bg-panel-2/80 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden backdrop-blur-md scroll-mt-4"
      >
        <h3 className="text-sm font-black text-slate-300 mb-2 tracking-[0.2em] uppercase">段位一覧</h3>
        <p className="text-[11px] text-slate-500 mb-6">タップすると、その中の細かい段位としきい値が見られます。</p>
        <div className="space-y-2">
          {groups.map((g, idx) => {
            const theme = RANK_GROUP_THEME[g.group];
            const isFirst = idx === 0;
            const isLast = idx === groups.length - 1;
            const rangeText = isFirst
              ? `${formatSignedYen(g.maxProfitExclusive!)} 未満`
              : isLast
                ? `${formatSignedYen(g.minProfit)} 以上`
                : `${formatSignedYen(g.minProfit)} 以上 〜 ${formatSignedYen(g.maxProfitExclusive!)} 未満`;
            const isExpanded = expandedGroups.has(g.group);

            return (
              <div key={g.group} className={`rounded-xl border overflow-hidden ${theme.border} ${theme.bg}`}>
                <button
                  type="button"
                  onClick={() => toggleGroup(g.group)}
                  aria-expanded={isExpanded}
                  aria-label={`${g.group}の内訳を${isExpanded ? '閉じる' : '開く'}`}
                  className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 px-5 py-3.5 text-left"
                >
                  <span className={`font-black text-sm tracking-wide shrink-0 ${theme.text}`}>{g.group}</span>
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="font-mono text-xs sm:text-sm text-slate-300">収支 {rangeText}</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 ${theme.text} transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 space-y-1.5">
                    {g.levels.map((tier) => (
                      <div key={tier.name} className="flex items-center justify-between gap-2 bg-abyss/50 rounded-lg px-4 py-2">
                        <span className={`font-bold text-xs shrink-0 ${theme.text}`}>{tier.name}</span>
                        <span className="font-mono text-[11px] text-slate-400 text-right whitespace-nowrap">
                          収支 {formatSignedYen(tier.minProfit)} 以上
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
