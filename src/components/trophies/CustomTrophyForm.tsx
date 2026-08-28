import { useState } from 'react';
import type { CustomTrophyConditionType, CustomTrophyDef } from '../../types';
import { CUSTOM_TROPHY_CONDITION_LABELS } from '../../lib/customTrophies';
import { NeonButton } from '../common/NeonButton';

const CONDITION_TYPES = Object.keys(CUSTOM_TROPHY_CONDITION_LABELS) as CustomTrophyConditionType[];

export function CustomTrophyForm({ onSave, onCancel }: { onSave: (trophy: Omit<CustomTrophyDef, 'id'>) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [conditionType, setConditionType] = useState<CustomTrophyConditionType>('profitAtLeast');
  const [threshold, setThreshold] = useState('');

  const canSave = name.trim() !== '' && threshold.trim() !== '' && Number.isFinite(Number(threshold));

  const handleSave = () => {
    if (!canSave) return;
    onSave({ name: name.trim(), description: description.trim(), conditionType, threshold: Number(threshold) });
  };

  return (
    <div className="bg-abyss/60 border border-fuchsia-700/40 rounded-2xl p-5 space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="トロフィー名（例: 令和の雷神）"
        className="w-full bg-panel-2 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-bold focus:outline-none focus:border-fuchsia-400"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="説明（任意）"
        className="w-full bg-panel-2 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-fuchsia-400"
      />
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={conditionType}
          onChange={(e) => setConditionType(e.target.value as CustomTrophyConditionType)}
          className="bg-panel-2 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-100 font-bold focus:outline-none focus:border-fuchsia-400"
        >
          {CONDITION_TYPES.map((type) => (
            <option key={type} value={type}>
              {CUSTOM_TROPHY_CONDITION_LABELS[type]}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          placeholder="しきい値"
          className="w-28 bg-panel-2 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-fuchsia-400"
        />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <NeonButton variant="primary" onClick={handleSave} disabled={!canSave} className="px-4 py-2 text-xs">
          作成する
        </NeonButton>
        <NeonButton variant="ghost" onClick={onCancel} className="px-4 py-2 text-xs">
          キャンセル
        </NeonButton>
      </div>
    </div>
  );
}
