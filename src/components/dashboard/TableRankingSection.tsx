import { useMemo, useState } from 'react';
import { ChevronDown, Users } from 'lucide-react';
import type { DayRecord, Player } from '../../types';
import { computeTableRanking } from '../../lib/tableRanking';
import { formatSignedYen } from '../../lib/format';
import { EmptyState } from '../common/EmptyState';

export function TableRankingSection({ history, players }: { history: DayRecord[]; players: Player[] }) {
  const [targetId, setTargetId] = useState('');
  const rows = useMemo(
    () => (targetId ? computeTableRanking(history, players, targetId) : []),
    [history, players, targetId],
  );
  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? '不明';

  if (players.length < 2) return null;

  return (
    <div className="bg-panel-2/80 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden group hover:border-yellow-800/80 transition-colors duration-500 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <h3 className="text-sm font-black text-yellow-400 mb-6 flex items-center tracking-[0.2em] uppercase">
        <Users className="w-5 h-5 mr-2" /> 同卓ランキング
        <span className="text-slate-500 ml-2 font-normal text-xs normal-case">(Most Played With)</span>
      </h3>

      <div className="relative mb-6 max-w-xs">
        <select
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          className="w-full bg-abyss border border-slate-700/80 rounded-xl pl-4 pr-9 py-2.5 sm:py-3 text-slate-100 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50 font-bold appearance-none transition-all cursor-pointer text-sm sm:text-base"
        >
          <option value="">雀士を選択</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500/70 pointer-events-none" />
      </div>

      {!targetId ? (
        <EmptyState icon={Users} message="Select a Player" hint="雀士を選ぶと、同卓回数が多い順にランキングが表示されます。" />
      ) : (
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div
              key={row.playerId}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 bg-abyss/60 px-5 py-4 rounded-2xl border border-slate-800/80"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-xs text-slate-500 w-5 text-right shrink-0">{idx + 1}</span>
                <span className="font-bold text-slate-200 truncate">{nameOf(row.playerId)}</span>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                <span className="text-xs text-slate-400 font-mono whitespace-nowrap">{row.gamesTogether} 半荘</span>
                <span
                  className={`font-mono font-black text-sm w-24 text-right ${row.profitAgainst >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                >
                  {formatSignedYen(row.profitAgainst)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
