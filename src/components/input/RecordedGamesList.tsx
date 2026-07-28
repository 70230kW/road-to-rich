import { useState } from 'react';
import { ListOrdered, Trash2 } from 'lucide-react';
import type { Game, Player } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';

export function RecordedGamesList({
  games,
  players,
  onRemove,
}: {
  games: Game[];
  players: Player[];
  onRemove: (gameId: string) => void;
}) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  if (games.length === 0) return null;

  const name = (pid: string) => players.find((p) => p.id === pid)?.name ?? '不明';

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-black text-slate-400 tracking-[0.2em] uppercase flex items-center">
        <ListOrdered className="w-4 h-4 mr-2 text-cyan-500" /> 本日の記録済み半荘
      </h3>
      <div className="space-y-2.5">
        {games.map((g, idx) => {
          const sorted = [...g.scores].sort((a, b) => a.rank - b.rank);
          return (
            <div
              key={g.id}
              className="flex items-center gap-3 md:gap-4 bg-panel-2/40 border border-slate-700/50 rounded-2xl px-4 py-3 hover:border-slate-500/50 transition-colors group"
            >
              <span className="shrink-0 text-cyan-500 font-mono font-black text-sm w-8">
                #{String(idx + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-xs md:text-sm">
                {sorted.map((s) => (
                  <span key={s.playerId} className="flex items-center gap-1.5 text-slate-300">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        s.point >= 0 ? 'bg-emerald-950/50 text-emerald-400' : 'bg-rose-950/50 text-rose-400'
                      }`}
                    >
                      {s.rank}着
                    </span>
                    <span className="font-bold">{name(s.playerId)}</span>
                    <span className="text-slate-500">{s.rawScore.toLocaleString()}</span>
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPendingDeleteId(g.id)}
                aria-label="この半荘を削除"
                className="shrink-0 p-2 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-60 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="半荘の記録を削除"
        message="この半荘の記録を削除します。この操作は取り消せません。よろしいですか？"
        confirmLabel="削除する"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) onRemove(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}
