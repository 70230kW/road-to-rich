import type { DayRecord, Player } from '../../types';

export function MatrixTable({ day, participantIds, players }: { day: DayRecord; participantIds: string[]; players: Player[] }) {
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
              <td className="px-1 sm:px-5 py-2 sm:py-4 border-r border-slate-700/50 text-cyan-500 font-black text-[10px] sm:text-base">
                #{String(idx + 1).padStart(2, '0')}
              </td>
              {participantIds.map((pid) => {
                const scoreData = g.scores.find((s) => s.playerId === pid);
                return (
                  <td key={pid} className="px-1 sm:px-5 py-2 sm:py-4 text-center">
                    {scoreData ? (
                      <div className="flex flex-col items-center">
                        <span className="text-slate-200 font-bold text-[11px] sm:text-base">{scoreData.rawScore.toLocaleString()}</span>
                        <span
                          className={`text-[8px] sm:text-[10px] mt-0.5 sm:mt-1 font-bold px-1 sm:px-2 py-0.5 rounded-full ${
                            scoreData.point >= 0 ? 'bg-emerald-950/50 text-emerald-400' : 'bg-rose-950/50 text-rose-400'
                          }`}
                        >
                          {scoreData.rank}着
                        </span>
                      </div>
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
