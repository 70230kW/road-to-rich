import { useState } from 'react';
import type { PlayerGoal } from '../../types';
import { NeonButton } from '../common/NeonButton';

export function GoalEditor({ goal, onSave }: { goal: PlayerGoal | null; onSave: (goal: PlayerGoal | null) => void }) {
  const [type, setType] = useState<PlayerGoal['type']>(goal?.type ?? 'profit');
  const [target, setTarget] = useState(goal ? String(goal.target) : '');

  const handleSave = () => {
    const value = Number(target);
    if (!Number.isFinite(value) || target.trim() === '') return;
    onSave({ type, target: value });
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-black text-emerald-400 tracking-widest uppercase">今月の目標</div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-slate-700/80 overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => setType('profit')}
            className={`px-3 py-2 text-xs font-bold transition-colors ${
              type === 'profit' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-abyss text-slate-400 hover:text-slate-200'
            }`}
          >
            収支目標（円）
          </button>
          <button
            type="button"
            onClick={() => setType('topRate')}
            className={`px-3 py-2 text-xs font-bold transition-colors border-l border-slate-700/80 ${
              type === 'topRate' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-abyss text-slate-400 hover:text-slate-200'
            }`}
          >
            トップ率目標（%）
          </button>
        </div>
        <input
          type="number"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder={type === 'profit' ? '例: 10000' : '例: 30'}
          className="w-28 bg-abyss border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-400"
        />
        <NeonButton variant="primary" onClick={handleSave} disabled={target.trim() === ''} className="px-4 py-2 text-xs">
          保存
        </NeonButton>
        {goal && (
          <button
            type="button"
            onClick={() => onSave(null)}
            className="text-xs font-bold text-slate-500 hover:text-rose-400 transition-colors"
          >
            目標をクリア
          </button>
        )}
      </div>
    </div>
  );
}
