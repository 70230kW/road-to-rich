import { useMemo } from 'react';
import { CalendarClock, Skull, Sparkles, TrendingDown } from 'lucide-react';
import type { DayRecord, Player } from '../../types';
import { computeMonthlyHighlights } from '../../lib/monthlyHighlights';
import { formatSignedYen } from '../../lib/format';

/** history には全期間（シーズン絞り込み前）の history を渡すこと。「今月」は常に実際の現在日基準。 */
export function MonthlyHighlightsSection({ history, players }: { history: DayRecord[]; players: Player[] }) {
  const highlights = useMemo(() => computeMonthlyHighlights(history, players), [history, players]);

  if (!highlights.hasData) return null;

  return (
    <div className="bg-panel-2/80 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden group hover:border-yellow-800/80 transition-colors duration-500 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <h3 className="text-sm font-black text-yellow-400 mb-6 flex items-center tracking-[0.2em] uppercase">
        <CalendarClock className="w-5 h-5 mr-2" /> {highlights.month}月のハイライト
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {highlights.mvp && (
          <div className="bg-abyss/80 p-5 rounded-2xl border border-yellow-700/50">
            <div className="flex items-center text-[10px] font-black text-yellow-500 tracking-widest uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> 今月のMVP
            </div>
            <div className="font-black text-lg text-slate-100 truncate">{highlights.mvp.name}</div>
            <div className="font-mono font-black text-emerald-400 mt-1">{formatSignedYen(highlights.mvp.value)}</div>
          </div>
        )}
        {highlights.worst && (
          <div className="bg-abyss/80 p-5 rounded-2xl border border-slate-700/60">
            <div className="flex items-center text-[10px] font-black text-slate-500 tracking-widest uppercase mb-2">
              <TrendingDown className="w-3.5 h-3.5 mr-1.5" /> 今月の受難
            </div>
            <div className="font-black text-lg text-slate-100 truncate">{highlights.worst.name}</div>
            <div className="font-mono font-black text-rose-400 mt-1">{formatSignedYen(highlights.worst.value)}</div>
          </div>
        )}
        {highlights.mostTobi && (
          <div className="bg-abyss/80 p-5 rounded-2xl border border-rose-800/50">
            <div className="flex items-center text-[10px] font-black text-rose-500 tracking-widest uppercase mb-2">
              <Skull className="w-3.5 h-3.5 mr-1.5" /> 今月のトビ王
            </div>
            <div className="font-black text-lg text-slate-100 truncate">{highlights.mostTobi.name}</div>
            <div className="font-mono font-black text-rose-400 mt-1">{highlights.mostTobi.value}回</div>
          </div>
        )}
      </div>
    </div>
  );
}
