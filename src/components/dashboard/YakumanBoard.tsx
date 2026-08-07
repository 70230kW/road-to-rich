import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { YakumanAchievement } from '../../lib/stats';
import { YAKUMAN_LIST } from '../../lib/yakuman';
import { YakumanDetailModal } from './YakumanDetailModal';

export function YakumanBoard({ achievements }: { achievements: Record<string, YakumanAchievement[]> }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = YAKUMAN_LIST.find((y) => y.id === selectedId) ?? null;

  return (
    <div className="bg-panel-2/80 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden group hover:border-purple-800/80 transition-colors duration-500 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <h3 className="text-sm font-black text-purple-400 mb-8 flex items-center tracking-[0.2em] uppercase">
        <Sparkles className="w-5 h-5 mr-2" /> 役満達成状況
        <span className="text-slate-500 ml-2 font-normal text-xs normal-case">(タップで詳細)</span>
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
        {YAKUMAN_LIST.map((y) => {
          const achieved = (achievements[y.id]?.length ?? 0) > 0;
          return (
            <button
              key={y.id}
              type="button"
              onClick={() => setSelectedId(y.id)}
              className={`relative text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                achieved
                  ? 'bg-purple-500/15 border-purple-400/60 hover:border-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'bg-abyss/40 border-slate-800/60 opacity-40 grayscale hover:opacity-60'
              }`}
            >
              {y.isDouble && (
                <span className="absolute top-1.5 right-1.5 text-[8px] font-black text-purple-400 font-mono">W</span>
              )}
              <div
                className={`font-black text-xs sm:text-sm tracking-wide ${achieved ? 'text-purple-100' : 'text-slate-400'}`}
              >
                {y.name}
              </div>
              {achieved && (
                <div className="text-[10px] text-purple-400 font-mono mt-1">{achievements[y.id].length}回達成</div>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <YakumanDetailModal
          yakuman={selected}
          achievements={achievements[selected.id] ?? []}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
