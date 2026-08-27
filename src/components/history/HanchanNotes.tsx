import { useState } from 'react';
import { StickyNote } from 'lucide-react';
import type { Game } from '../../types';

export function HanchanNotes({ games, onSaveNote }: { games: Game[]; onSaveNote: (gameId: string, note: string) => void }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const valueFor = (game: Game) => drafts[game.id] ?? game.note ?? '';

  const commit = (game: Game) => {
    const draft = drafts[game.id];
    if (draft === undefined) return;
    const trimmed = draft.trim();
    if (trimmed !== (game.note ?? '')) onSaveNote(game.id, trimmed);
  };

  return (
    <div className="space-y-2">
      {games.map((game, idx) => (
        <div key={game.id} className="flex items-center gap-3 bg-panel-2/40 border border-slate-700/50 rounded-xl px-4 py-2.5">
          <span className="shrink-0 text-emerald-500 font-mono font-black text-xs">#{String(idx + 1).padStart(2, '0')}</span>
          <StickyNote className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <input
            type="text"
            maxLength={100}
            value={valueFor(game)}
            placeholder="この半荘のメモを追加（例: 〇〇が大三元）"
            onChange={(e) => setDrafts((prev) => ({ ...prev, [game.id]: e.target.value }))}
            onBlur={() => commit(game)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            className="flex-1 min-w-0 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
          />
        </div>
      ))}
    </div>
  );
}
