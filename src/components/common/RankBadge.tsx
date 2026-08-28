import { Gauge } from 'lucide-react';
import type { PlayerRankStatus } from '../../lib/rankLevel';

export function RankBadge({ status }: { status: PlayerRankStatus }) {
  return (
    <span
      title={`累計 ${status.cumulativePt}pt`}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 tracking-wide whitespace-nowrap"
    >
      <Gauge className="w-2.5 h-2.5 shrink-0" /> {status.levelName}
    </span>
  );
}
