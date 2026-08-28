import { useMemo } from 'react';
import { Shuffle } from 'lucide-react';
import type { DayRecord, Player } from '../../types';
import { computeRarePairs } from '../../lib/matchmaking';
import { formatDateShort } from '../../lib/format';

export function MatchmakingSection({ history, players }: { history: DayRecord[]; players: Player[] }) {
  const suggestions = useMemo(() => computeRarePairs(history, players, 3), [history, players]);
  const name = (id: string) => players.find((p) => p.id === id)?.name ?? '不明';

  if (players.length < 2 || suggestions.length === 0) return null;

  return (
    <div className="bg-panel-2/80 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden group hover:border-yellow-800/80 transition-colors duration-500 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <h3 className="text-sm font-black text-yellow-400 mb-6 flex items-center tracking-[0.2em] uppercase">
        <Shuffle className="w-5 h-5 mr-2" /> 次はこの組み合わせ？
      </h3>
      <div className="space-y-3">
        {suggestions.map((s) => (
          <div
            key={`${s.playerAId}-${s.playerBId}`}
            className="flex items-center justify-between gap-4 bg-abyss/60 px-5 py-4 rounded-2xl border border-slate-800/80"
          >
            <span className="font-bold text-slate-200">
              {name(s.playerAId)} <span className="text-slate-600 mx-1">×</span> {name(s.playerBId)}
            </span>
            <span className="text-xs text-slate-500 font-mono text-right shrink-0">
              {s.sharedHanchanCount === 0
                ? 'まだ同卓なし'
                : `同卓${s.sharedHanchanCount}回・最終${formatDateShort(s.lastPlayedDate!)}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
