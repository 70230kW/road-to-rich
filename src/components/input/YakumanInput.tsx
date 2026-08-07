import { useMemo, useState } from 'react';
import { Plus, Sparkles, Trash2, X } from 'lucide-react';
import type { Player, YakumanEvent } from '../../types';
import { areYakumanCompatible, YAKUMAN_LIST } from '../../lib/yakuman';
import { NeonButton } from '../common/NeonButton';

function uid(): string {
  return crypto.randomUUID();
}

export function YakumanInput({
  players,
  participantIds,
  events,
  onChange,
}: {
  players: Player[];
  participantIds: string[];
  events: YakumanEvent[];
  onChange: (events: YakumanEvent[]) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [draftPlayerId, setDraftPlayerId] = useState<string | null>(null);
  const [draftYakumanIds, setDraftYakumanIds] = useState<string[]>([]);

  const name = (id: string) => players.find((p) => p.id === id)?.name ?? '不明';

  const resetDraft = () => {
    setIsAdding(false);
    setDraftPlayerId(null);
    setDraftYakumanIds([]);
  };

  const toggleDraftYakuman = (id: string) => {
    setDraftYakumanIds((prev) => (prev.includes(id) ? prev.filter((y) => y !== id) : [...prev, id]));
  };

  // 選択中の役満と複合しえない役満は、選び直しを防ぐためグレーアウトして選択不可にする。
  const incompatibleIds = useMemo(() => {
    const blocked = new Set<string>();
    for (const y of YAKUMAN_LIST) {
      if (draftYakumanIds.includes(y.id)) continue;
      if (draftYakumanIds.some((selectedId) => !areYakumanCompatible(selectedId, y.id))) {
        blocked.add(y.id);
      }
    }
    return blocked;
  }, [draftYakumanIds]);

  const confirmAdd = () => {
    if (!draftPlayerId || draftYakumanIds.length === 0) return;
    onChange([...events, { id: uid(), playerId: draftPlayerId, yakumanIds: draftYakumanIds }]);
    resetDraft();
  };

  const removeEvent = (id: string) => {
    onChange(events.filter((e) => e.id !== id));
  };

  return (
    <div className="bg-purple-950/20 border border-purple-500/30 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-purple-300 tracking-wide flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" /> 役満（あれば記録）
        </p>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-xs font-bold text-purple-300 hover:text-purple-100 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg border border-purple-500/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> 追加
          </button>
        )}
      </div>

      {events.length > 0 && (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between gap-3 bg-abyss/80 border border-slate-700/60 rounded-xl px-4 py-2.5"
            >
              <span className="text-sm font-bold text-slate-200">
                {name(event.playerId)}:{' '}
                <span className="text-purple-300">
                  {event.yakumanIds.map((id) => YAKUMAN_LIST.find((y) => y.id === id)?.name ?? id).join(' + ')}
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeEvent(event.id)}
                aria-label="この役満記録を削除"
                className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {isAdding && (
        <div className="bg-abyss/80 border border-purple-500/30 rounded-xl p-4 space-y-4">
          <div>
            <label className="block text-[11px] font-black text-slate-400 tracking-widest uppercase mb-2">成就者</label>
            <div className="flex flex-wrap gap-2">
              {participantIds.map((pid) => (
                <button
                  key={pid}
                  type="button"
                  onClick={() => setDraftPlayerId(pid)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${
                    draftPlayerId === pid
                      ? 'bg-purple-500/30 border-purple-400 text-purple-100'
                      : 'bg-panel-2/60 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {name(pid)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-400 tracking-widest uppercase mb-2">
              役満（複合する場合は複数選択可）
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1">
              {YAKUMAN_LIST.map((y) => {
                const isSelected = draftYakumanIds.includes(y.id);
                const isBlocked = incompatibleIds.has(y.id);
                return (
                  <label
                    key={y.id}
                    title={isBlocked ? '選択中の役満とは複合できません' : undefined}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                      isBlocked
                        ? 'bg-panel-2/20 border-slate-800/60 text-slate-600 opacity-40 grayscale cursor-not-allowed'
                        : isSelected
                          ? 'bg-purple-500/20 border-purple-400/60 text-purple-100 cursor-pointer'
                          : 'bg-panel-2/40 border-slate-700/60 text-slate-300 hover:border-slate-500 cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isBlocked}
                      onChange={() => toggleDraftYakuman(y.id)}
                      className="accent-purple-500"
                    />
                    {y.name}
                    {y.isDouble && <span className="text-[9px] text-purple-400 font-mono">W</span>}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={resetDraft}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors"
            >
              <X className="w-4 h-4" /> キャンセル
            </button>
            <NeonButton
              variant="primary"
              onClick={confirmAdd}
              disabled={!draftPlayerId || draftYakumanIds.length === 0}
              className="flex-1 py-2.5"
            >
              追加する
            </NeonButton>
          </div>
        </div>
      )}
    </div>
  );
}
