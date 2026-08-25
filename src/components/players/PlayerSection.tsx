import { useState } from 'react';
import { Check, Edit2, Palette, Plus, Trash2, Users } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { PLAYER_COLOR_PALETTE } from '../../lib/playerColors';
import { SectionHeader } from '../common/SectionHeader';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { NeonButton } from '../common/NeonButton';

export function PlayerSection() {
  const players = useAppStore((s) => s.players);
  const settings = useAppStore((s) => s.settings);
  const history = useAppStore((s) => s.history);
  const addPlayer = useAppStore((s) => s.addPlayer);
  const updatePlayer = useAppStore((s) => s.updatePlayer);
  const setPlayerColor = useAppStore((s) => s.setPlayerColor);
  const removePlayer = useAppStore((s) => s.removePlayer);

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [colorPickerId, setColorPickerId] = useState<string | null>(null);

  const minRequired = settings.playerCount;
  const canDelete = players.length > minRequired;

  const handleAdd = () => {
    if (!newName.trim()) return;
    addPlayer(newName);
    setNewName('');
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const saveEdit = (id: string) => {
    if (editName.trim()) updatePlayer(id, editName);
    setEditingId(null);
  };

  const pendingPlayer = players.find((p) => p.id === pendingDeleteId);
  const pendingHasHistory = pendingDeleteId
    ? history.some((day) => Object.keys(day.settlement).includes(pendingDeleteId))
    : false;

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeader icon={Users} title="雀士登録" accent="cyan" />

      <div className="flex flex-col sm:flex-row gap-4 bg-panel-2/60 p-6 rounded-[2rem] border border-slate-700/50 backdrop-blur-sm">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="新しい雀士の名前"
          className="flex-1 bg-abyss border border-slate-700/80 rounded-xl px-5 py-4 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 placeholder-slate-600 transition-all shadow-inner font-bold tracking-wide"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <NeonButton variant="primary" onClick={handleAdd} disabled={!newName.trim()} className="sm:w-auto px-4">
          <Plus className="w-5 h-5 mr-2" /> 追加
        </NeonButton>
      </div>

      {players.length === 0 ? (
        <EmptyState icon={Users} message="No Players" hint="まずは雀士を登録しましょう。" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {players.map((p) => {
            const colorsInUseByOthers = new Set(players.filter((o) => o.id !== p.id).map((o) => o.color));
            const isPickingColor = colorPickerId === p.id;
            return (
              <div
                key={p.id}
                className="bg-panel-2/40 p-5 rounded-2xl border border-slate-700/50 group hover:border-cyan-500/50 transition-all duration-300 hover:bg-panel-2/80 backdrop-blur-sm"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => setColorPickerId(isPickingColor ? null : p.id)}
                      aria-label={`${p.name}の色を変更`}
                      aria-pressed={isPickingColor}
                      className="shrink-0 w-7 h-7 rounded-full border-2 border-slate-700 hover:border-slate-400 transition-all flex items-center justify-center"
                      style={{ backgroundColor: p.color, boxShadow: `0 0 10px ${p.color}` }}
                    >
                      <Palette className="w-3.5 h-3.5 text-black/40" />
                    </button>

                    {editingId === p.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(p.id)}
                        className="flex-1 bg-abyss border border-cyan-400 rounded-xl px-4 py-2.5 text-slate-100 mr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 font-bold tracking-wide"
                        autoFocus
                      />
                    ) : (
                      <span className="font-black text-slate-200 text-lg tracking-wider group-hover:text-cyan-100 transition-colors truncate">
                        {p.name}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {editingId === p.id ? (
                      <button
                        onClick={() => saveEdit(p.id)}
                        className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 border border-emerald-500/50 transition-all"
                        aria-label="保存"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => startEdit(p.id, p.name)}
                        className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 border border-blue-500/30 transition-all opacity-100 md:opacity-40 group-hover:opacity-100"
                        aria-label="編集"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setPendingDeleteId(p.id)}
                        className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500/20 border border-rose-500/30 transition-all opacity-100 md:opacity-40 group-hover:opacity-100"
                        aria-label="削除"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {isPickingColor && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-700/50">
                    {PLAYER_COLOR_PALETTE.map((color) => {
                      const isUsedByOther = colorsInUseByOthers.has(color);
                      const isSelected = p.color === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          disabled={isUsedByOther}
                          title={isUsedByOther ? '他の雀士が使用中の色です' : color}
                          onClick={() => {
                            setPlayerColor(p.id, color);
                            setColorPickerId(null);
                          }}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            isUsedByOther
                              ? 'opacity-25 grayscale cursor-not-allowed border-transparent'
                              : isSelected
                                ? 'border-white scale-110'
                                : 'border-transparent hover:scale-110 hover:border-slate-400'
                          }`}
                          style={{ backgroundColor: color, boxShadow: isSelected ? `0 0 10px ${color}` : 'none' }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!canDelete && players.length > 0 && (
        <p className="text-xs text-slate-500 text-center">
          現在の対局形式（{minRequired}人麻雀）を維持するため、雀士は最低 {minRequired} 人必要です。
        </p>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="雀士を削除"
        message={
          pendingHasHistory
            ? `「${pendingPlayer?.name}」を削除します。過去の対戦履歴には引き続き記録が残りますが、名前は表示されなくなります。よろしいですか？`
            : `「${pendingPlayer?.name}」を削除します。この操作は取り消せません。よろしいですか？`
        }
        confirmLabel="削除する"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) removePlayer(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}
