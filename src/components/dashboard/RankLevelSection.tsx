import { useMemo } from 'react';
import { Gauge } from 'lucide-react';
import type { DayRecord, Player, Settings } from '../../types';
import { computePlayerRankStatuses } from '../../lib/rankLevel';
import { RANK_GROUP_THEME } from '../common/RankBadge';

export function RankLevelSection({ history, players, settings }: { history: DayRecord[]; players: Player[]; settings: Settings }) {
  const statuses = useMemo(() => computePlayerRankStatuses(history, players, settings), [history, players, settings]);
  const activeStatuses = players.map((p) => statuses[p.id]).filter((s): s is NonNullable<typeof s> => Boolean(s));

  if (activeStatuses.length === 0) return null;

  return (
    <div className="bg-panel-2/80 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden group hover:border-cyan-800/80 transition-colors duration-500 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <h3 className="text-sm font-black text-cyan-400 mb-6 flex items-center tracking-[0.2em] uppercase">
        <Gauge className="w-5 h-5 mr-2" /> 段位
        <span className="text-slate-500 ml-2 font-normal text-xs normal-case">(Rank)</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {players.map((p) => {
          const status = statuses[p.id];
          if (!status) return null;
          const theme = RANK_GROUP_THEME[status.group];
          return (
            <div key={p.id} className="bg-abyss/70 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-200 truncate">{p.name}</span>
                <span className={`font-mono text-sm font-black shrink-0 ${theme.text}`}>{status.levelName}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${theme.bar} transition-all`}
                  style={{ width: `${status.progressRatio * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-1.5">
                {status.nextLevelName ? `次の${status.nextLevelName}まであと${status.ptToNextLevel}pt` : '最高段位に到達！'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
