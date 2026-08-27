import { useMemo, useState } from 'react';
import { PartyPopper, X } from 'lucide-react';
import type { DayRecord, Player } from '../../types';
import { computeLatestMilestones } from '../../lib/milestones';

/** history には全期間（シーズン絞り込み前）の history を渡すこと。表示状態はセッション内のみ（既読管理は永続化しない）。 */
export function MilestoneBanner({ history, players }: { history: DayRecord[]; players: Player[] }) {
  const events = useMemo(() => computeLatestMilestones(history, players), [history, players]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = events.filter((e) => !dismissed.has(e.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {visible.map((event) => (
        <div
          key={event.id}
          className="flex items-center justify-between gap-3 bg-gradient-to-r from-yellow-950/40 via-panel-2/80 to-panel-2/80 border border-yellow-600/40 rounded-2xl px-5 py-3.5 shadow-[0_0_20px_rgba(250,204,21,0.1)] animate-fade-in"
        >
          <span className="flex items-center gap-2.5 text-sm font-bold text-yellow-100">
            <PartyPopper className="w-4 h-4 text-yellow-400 shrink-0" />
            {event.message}
          </span>
          <button
            type="button"
            onClick={() => setDismissed((prev) => new Set(prev).add(event.id))}
            aria-label="閉じる"
            className="shrink-0 p-1.5 rounded-lg text-yellow-500/60 hover:text-yellow-200 hover:bg-yellow-500/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
