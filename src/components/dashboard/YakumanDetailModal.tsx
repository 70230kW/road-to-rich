import { Crown, X } from 'lucide-react';
import type { YakumanAchievement } from '../../lib/stats';
import type { YakumanDef } from '../../lib/yakuman';
import { formatDate } from '../../lib/format';

export function YakumanDetailModal({
  yakuman,
  achievements,
  onClose,
}: {
  yakuman: YakumanDef;
  achievements: YakumanAchievement[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="yakuman-detail-title"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#0b1120] border border-purple-500/40 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(168,85,247,0.2)] overflow-hidden max-h-[85vh] overflow-y-auto">
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-4 mb-4">
          <div>
            {yakuman.isDouble && (
              <div className="text-[10px] font-black text-purple-400 tracking-[0.2em] uppercase mb-1">ダブル役満</div>
            )}
            <h3 id="yakuman-detail-title" className="text-2xl font-black text-slate-100 tracking-wide">
              {yakuman.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="relative z-10 text-sm text-slate-400 leading-relaxed mb-6">{yakuman.description}</p>

        <h4 className="relative z-10 text-xs font-black text-purple-400 mb-3 tracking-[0.2em] uppercase flex items-center">
          <Crown className="w-3.5 h-3.5 mr-1.5" /> 達成記録
        </h4>

        {achievements.length === 0 ? (
          <p className="relative z-10 text-sm text-slate-600">まだ誰も達成していません。</p>
        ) : (
          <div className="relative z-10 space-y-2">
            {achievements.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-abyss/80 border border-slate-800/80 rounded-xl px-4 py-2.5"
              >
                <span className="font-bold text-slate-200 text-sm">{a.playerName}</span>
                <span className="text-xs text-slate-500 font-mono">{formatDate(a.date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
