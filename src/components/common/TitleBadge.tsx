import { Sparkles } from 'lucide-react';
import type { PlayerTitle } from '../../lib/titles';

export function TitleBadge({ title }: { title: PlayerTitle }) {
  return (
    <span
      title={title.description}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/30 tracking-wide whitespace-nowrap"
    >
      <Sparkles className="w-2.5 h-2.5 shrink-0" /> {title.title}
    </span>
  );
}
