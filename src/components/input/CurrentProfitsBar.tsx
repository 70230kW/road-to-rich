import { Activity } from 'lucide-react';
import { useMemo } from 'react';
import type { Game, Player } from '../../types';
import { formatSignedYen } from '../../lib/format';

export function CurrentProfitsBar({ games, players }: { games: Game[]; players: Player[] }) {
  const profits = useMemo(() => {
    const map = new Map<string, number>();
    games.forEach((g) => {
      g.scores.forEach((s) => {
        map.set(s.playerId, (map.get(s.playerId) ?? 0) + s.point);
      });
    });
    return map;
  }, [games]);

  if (games.length === 0) return null;

  return (
    <div className="bg-panel-2/60 p-5 md:p-6 rounded-3xl border border-cyan-900/40 shadow-[0_0_20px_rgba(6,182,212,0.1)] backdrop-blur-sm animate-fade-in">
      <h3 className="text-xs font-black text-cyan-400 mb-4 tracking-[0.2em] uppercase flex items-center">
        <Activity className="w-4 h-4 mr-2 animate-pulse" /> 現在の暫定損益 ({games.length}G)
      </h3>
      <div className="flex flex-wrap gap-3 md:gap-4">
        {[...profits.entries()].map(([pid, profit]) => {
          const name = players.find((p) => p.id === pid)?.name ?? '不明';
          return (
            <div
              key={pid}
              className="bg-abyss/80 px-4 py-2.5 rounded-xl border border-slate-700/60 flex items-center gap-3 shadow-inner"
            >
              <span className="text-sm font-bold text-slate-300 tracking-wide">{name}</span>
              <span
                className={`text-base font-mono font-black ${
                  profit >= 0
                    ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                    : 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                }`}
              >
                {formatSignedYen(profit)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
