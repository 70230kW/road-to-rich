import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, StickyNote, X } from 'lucide-react';
import type { DayRecord, Player } from '../../types';
import { formatDate, formatSignedYen, formatYen } from '../../lib/format';
import { MatrixTable } from '../history/MatrixTable';
import { PointMatrixTable } from '../history/PointMatrixTable';

function DaySessionBlock({ day, players }: { day: DayRecord; players: Player[] }) {
  const participantIds = useMemo(() => {
    const seen = new Set<string>();
    day.games.forEach((g) => g.scores.forEach((s) => seen.add(s.playerId)));
    return players.filter((p) => seen.has(p.id)).map((p) => p.id);
  }, [day, players]);

  const notedGames = useMemo(() => day.games.map((g, i) => ({ index: i, note: g.note })).filter((g) => g.note), [day]);

  const name = (id: string) => players.find((p) => p.id === id)?.name ?? '不明';

  return (
    <div className="bg-abyss/60 p-5 rounded-2xl border border-slate-800/80">
      <div className="text-xs text-slate-400 mb-4 flex flex-wrap items-center gap-3 font-bold tracking-wider">
        <span className="bg-[#0a192f] border border-cyan-900/50 px-3 py-1 rounded-md text-cyan-400">
          {day.games.length} 半荘
        </span>
        <span>場代: {formatYen(day.tableFee)}円</span>
        <span>チップ: {formatYen(day.chipRate)}円/枚</span>
        <span>{participantIds.length}人参加</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {participantIds.map((pid) => {
          const entry = day.settlement[pid];
          return (
            <div key={pid} className="bg-panel-2/60 p-3.5 rounded-xl border border-slate-700/80">
              <div className="text-[11px] font-bold text-slate-400 mb-1.5">{name(pid)}</div>
              <div
                className={`font-mono font-black text-lg ${
                  entry.totalWithFee >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatSignedYen(entry.totalWithFee)}
              </div>
            </div>
          );
        })}
      </div>

      <h5 className="text-[10px] font-black text-blue-400 mb-3 tracking-[0.2em] uppercase">半荘マトリックス</h5>
      <MatrixTable day={day} participantIds={participantIds} players={players} />

      <h5 className="text-[10px] font-black text-emerald-400 mt-6 mb-3 tracking-[0.2em] uppercase">半荘別 獲得金額</h5>
      <PointMatrixTable day={day} participantIds={participantIds} players={players} />

      {notedGames.length > 0 && (
        <div className="mt-6 space-y-1.5">
          {notedGames.map(({ index, note }) => (
            <div key={index} className="flex items-start gap-2 text-xs text-slate-400">
              <StickyNote className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
              <span>
                <span className="font-mono font-bold text-slate-500">#{String(index + 1).padStart(2, '0')}</span> {note}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DayDetailModal({
  dateKey,
  days,
  players,
  onClose,
}: {
  dateKey: string;
  days: DayRecord[];
  players: Player[];
  onClose: () => void;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-detail-title"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#0b1120] border border-emerald-500/40 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(16,185,129,0.2)] overflow-hidden max-h-[85vh] overflow-y-auto">
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center">
            <CalendarDays className="w-5 h-5 mr-2.5 text-emerald-400" />
            <h3 id="day-detail-title" className="text-xl md:text-2xl font-black text-slate-100 tracking-wide font-mono">
              {formatDate(dateKey)}
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

        <div className="relative z-10 space-y-5">
          {days.map((day) => (
            <DaySessionBlock key={day.id} day={day} players={players} />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
