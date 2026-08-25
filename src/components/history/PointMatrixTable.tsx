import type { DayRecord, Player } from '../../types';
import { formatSignedYen } from '../../lib/format';

export function PointMatrixTable({
  day,
  participantIds,
  players,
}: {
  day: DayRecord;
  participantIds: string[];
  players: Player[];
}) {
  const name = (id: string) => players.find((p) => p.id === id)?.name ?? '不明';

  return (
    <div className="rounded-2xl border border-slate-700/50 shadow-inner relative z-10">
      <table className="w-full table-fixed text-[11px] sm:text-sm text-left">
        <thead className="text-slate-400 bg-abyss uppercase tracking-widest">
          <tr>
            <th className="w-10 sm:w-auto px-1 sm:px-5 py-2 sm:py-4 border-r border-slate-700/50 font-black text-[10px] sm:text-xs">半荘</th>
            {participantIds.map((pid) => (
              <th key={pid} className="px-1 sm:px-5 py-2 sm:py-4 text-center font-black text-[10px] sm:text-xs truncate">
                {name(pid)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono">
          {day.games.map((g, idx) => (
            <tr key={g.id} className="border-b border-slate-700/50 bg-panel-2/40 hover:bg-slate-800/60 transition-colors">
              <td className="px-1 sm:px-5 py-2 sm:py-4 border-r border-slate-700/50 text-emerald-500 font-black text-[10px] sm:text-base">
                #{String(idx + 1).padStart(2, '0')}
              </td>
              {participantIds.map((pid) => {
                const scoreData = g.scores.find((s) => s.playerId === pid);
                return (
                  <td key={pid} className="px-1 sm:px-5 py-2 sm:py-4 text-center">
                    {scoreData ? (
                      <span
                        className={`font-bold text-[11px] sm:text-base ${
                          scoreData.point >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatSignedYen(scoreData.point)}
                      </span>
                    ) : (
                      <span className="text-slate-600 font-bold">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
