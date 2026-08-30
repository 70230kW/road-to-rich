import { useMemo } from 'react';
import { Gauge, Users } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { computePlayerRankStatuses, RANK_TIERS } from '../../lib/rankLevel';
import { RANK_GROUP_THEME } from '../common/RankBadge';
import { formatSignedYen } from '../../lib/format';
import { SectionHeader } from '../common/SectionHeader';
import { EmptyState } from '../common/EmptyState';

export function RankSection() {
  const players = useAppStore((s) => s.players);
  const history = useAppStore((s) => s.history);
  const statuses = useMemo(() => computePlayerRankStatuses(history, players), [history, players]);

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
        ※ 段位はポイント変換をせず、実際に勝った金額（場代抜きの累計収支、総合ランキングと同じ基準）で判定します。シーズンに関係なく通算の成績で決まります。
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {players.map((p) => {
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

      <div className="bg-panel-2/80 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden backdrop-blur-md">
        <h3 className="text-sm font-black text-slate-300 mb-6 tracking-[0.2em] uppercase">段位一覧</h3>
        <div className="space-y-2">
          {RANK_TIERS.map((tier) => {
            const theme = RANK_GROUP_THEME[tier.group];
            return (
              <div
                key={tier.name}
                className={`flex items-center justify-between px-5 py-3.5 rounded-xl border ${theme.border} ${theme.bg}`}
              >
                <span className={`font-black text-sm tracking-wide ${theme.text}`}>{tier.name}</span>
                <span className="font-mono text-xs sm:text-sm text-slate-300">
                  累計収支 {formatSignedYen(tier.minProfit)} 以上
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
