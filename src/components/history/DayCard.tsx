import { useMemo, useState } from 'react';
import { ChevronDown, DollarSign, Pencil, StickyNote, Trash2 } from 'lucide-react';
import type { DayRecord, Player, Settings } from '../../types';
import { formatDate, formatSignedYen, formatYen } from '../../lib/format';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DayEditor } from './DayEditor';
import { MatrixTable } from './MatrixTable';
import { PointMatrixTable } from './PointMatrixTable';
import { HanchanNotes } from './HanchanNotes';

export function DayCard({
  day,
  players,
  settings,
  isExpanded,
  onToggle,
  onUpdateDay,
  onDeleteDay,
}: {
  day: DayRecord;
  players: Player[];
  settings: Settings;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateDay: (dayId: string, patch: Omit<DayRecord, 'id' | 'date'>) => void;
  onDeleteDay: (dayId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const participantIds = useMemo(() => {
    const seen = new Set<string>();
    day.games.forEach((g) => g.scores.forEach((s) => seen.add(s.playerId)));
    return players.filter((p) => seen.has(p.id)).map((p) => p.id);
  }, [day, players]);

  const name = (id: string) => players.find((p) => p.id === id)?.name ?? '不明';

  const saveNote = (gameId: string, note: string) => {
    onUpdateDay(day.id, {
      games: day.games.map((g) => (g.id === gameId ? { ...g, note: note || undefined } : g)),
      tableFee: day.tableFee,
      chips: day.chips,
      chipRate: day.chipRate,
      settlement: day.settlement,
    });
  };

  if (isEditing) {
    return (
      <DayEditor
        day={day}
        players={players}
        settings={settings}
        onCancel={() => setIsEditing(false)}
        onSave={(patch) => {
          onUpdateDay(day.id, patch);
          setIsEditing(false);
        }}
      />
    );
  }

  return (
    <div
      className={`bg-panel-2/60 border transition-all duration-300 rounded-[2rem] overflow-hidden backdrop-blur-sm ${
        isExpanded ? 'border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.15)]' : 'border-slate-700/50 hover:border-slate-500/50'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full text-left p-5 md:p-6 bg-abyss/40 flex justify-between items-center cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="relative z-10">
          <div className="font-mono text-cyan-300 font-black text-lg md:text-xl tracking-widest drop-shadow-md">
            {formatDate(day.date)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex flex-wrap items-center gap-3 md:gap-4 font-bold tracking-wider">
            <span className="bg-[#0a192f] border border-cyan-900/50 px-3 py-1 rounded-md text-cyan-400">
              {day.games.length} 半荘
            </span>
            <span className="flex items-center">
              <DollarSign className="w-3 h-3 mr-0.5" />
              場代: {formatYen(day.tableFee)}円
            </span>
            <span>チップ: {formatYen(day.chipRate)}円/枚</span>
            <span>{participantIds.length}人参加</span>
          </div>
        </div>
        <div
          className={`shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 relative z-10 ${
            isExpanded
              ? 'bg-cyan-900/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'bg-panel-2 text-slate-400 group-hover:bg-slate-800 group-hover:text-cyan-400'
          }`}
        >
          <ChevronDown className={`w-6 h-6 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isExpanded && (
        <div className="p-5 md:p-8 border-t border-slate-700/50 bg-panel-3/80 relative animate-fade-in">
          <div className="flex justify-end gap-2 mb-6 relative z-10">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 transition-all"
            >
              <Pencil className="w-3.5 h-3.5" /> 編集
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> 削除
            </button>
          </div>

          <h4 className="text-xs font-black text-cyan-400 mb-4 tracking-[0.2em] uppercase flex items-center relative z-10">
            <span className="w-2 h-2 rounded-full bg-cyan-400 mr-2 shadow-[0_0_8px_rgba(34,211,238,1)]" />
            この日の精算結果
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 relative z-10">
            {participantIds.map((pid) => {
              const entry = day.settlement[pid];
              return (
                <div
                  key={pid}
                  className="bg-abyss p-4 rounded-2xl border border-slate-700/80 flex flex-col justify-center relative overflow-hidden group hover:border-cyan-800/80 transition-colors"
                >
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="text-xs font-bold text-slate-400 mb-2 tracking-wide pl-1">{name(pid)}</div>
                  <div
                    className={`font-mono font-black text-xl md:text-2xl pl-1 ${
                      entry.totalWithFee >= 0 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-rose-400'
                    }`}
                  >
                    {formatSignedYen(entry.totalWithFee)}
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono mt-1 pl-1">場代抜き {formatSignedYen(entry.totalWithoutFee)}</div>
                </div>
              );
            })}
          </div>

          <h4 className="text-xs font-black text-blue-400 mb-4 tracking-[0.2em] uppercase flex items-center relative z-10">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 shadow-[0_0_8px_rgba(59,130,246,1)]" />
            半荘マトリックス
          </h4>
          <MatrixTable day={day} participantIds={participantIds} players={players} />

          <h4 className="text-xs font-black text-emerald-400 mt-10 mb-4 tracking-[0.2em] uppercase flex items-center relative z-10">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,1)]" />
            半荘別 獲得金額
          </h4>
          <PointMatrixTable day={day} participantIds={participantIds} players={players} />

          <h4 className="text-xs font-black text-slate-400 mt-10 mb-4 tracking-[0.2em] uppercase flex items-center relative z-10">
            <StickyNote className="w-3.5 h-3.5 mr-2" />
            対局メモ
          </h4>
          <HanchanNotes games={day.games} onSaveNote={saveNote} />
        </div>
      )}

      <ConfirmDialog
        open={confirmingDelete}
        title="対戦履歴を削除"
        message={`${formatDate(day.date)}の対戦履歴を削除します。この操作は取り消せません。よろしいですか？`}
        confirmLabel="削除する"
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          onDeleteDay(day.id);
          setConfirmingDelete(false);
        }}
      />
    </div>
  );
}
