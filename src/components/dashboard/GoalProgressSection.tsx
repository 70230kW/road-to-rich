import { useMemo } from 'react';
import { Target } from 'lucide-react';
import type { DayRecord, Player, PlayerGoal } from '../../types';
import { computeGoalProgress } from '../../lib/goals';
import { formatSignedYen } from '../../lib/format';

/** history には全期間（シーズン絞り込み前）の history を渡すこと。「今月」は常に実際の現在日基準。 */
export function GoalProgressSection({
  history,
  players,
  goals,
}: {
  history: DayRecord[];
  players: Player[];
  goals: Record<string, PlayerGoal>;
}) {
  const progress = useMemo(() => computeGoalProgress(history, players, goals), [history, players, goals]);
  const withGoals = players.filter((p) => progress[p.id]);

  if (withGoals.length === 0) return null;

  return (
    <div className="bg-panel-2/80 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden group hover:border-emerald-800/80 transition-colors duration-500 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <h3 className="text-sm font-black text-emerald-400 mb-6 flex items-center tracking-[0.2em] uppercase">
        <Target className="w-5 h-5 mr-2" /> 今月の目標
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {withGoals.map((p) => {
          const gp = progress[p.id]!;
          const pct = Math.min(1, gp.progressRatio) * 100;
          const targetLabel = gp.goal.type === 'profit' ? `${formatSignedYen(gp.goal.target)}` : `${gp.goal.target}%`;
          const currentLabel = gp.goal.type === 'profit' ? formatSignedYen(gp.currentValue) : `${gp.currentValue.toFixed(1)}%`;
          return (
            <div key={p.id} className="bg-abyss/70 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-200 truncate">{p.name}</span>
                <span className={`font-mono text-xs font-black shrink-0 ${gp.achieved ? 'text-emerald-300' : 'text-slate-400'}`}>
                  {currentLabel} / {targetLabel}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all ${gp.achieved ? 'bg-gradient-to-r from-emerald-500 to-emerald-300' : 'bg-gradient-to-r from-cyan-600 to-cyan-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {gp.achieved && <div className="text-[10px] text-emerald-400 font-black mt-1.5">達成！</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
