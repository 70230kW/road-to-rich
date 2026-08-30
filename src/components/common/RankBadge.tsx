import { Gauge } from 'lucide-react';
import type { PlayerRankStatus, RankGroup } from '../../lib/rankLevel';
import { formatSignedYen } from '../../lib/format';

/** 段位の大分類（地底人/雀士/雀傑/雀豪/雀聖/魂天）ごとの配色。同じ分類の段位（雀豪1〜3など）は同じ色になる。 */
export const RANK_GROUP_THEME: Record<RankGroup, { text: string; border: string; bg: string; bar: string }> = {
  地底人: {
    text: 'text-rose-400',
    border: 'border-rose-700/50',
    bg: 'bg-rose-950/30',
    bar: 'from-rose-700 to-rose-500',
  },
  雀士: {
    text: 'text-slate-300',
    border: 'border-slate-500/40',
    bg: 'bg-slate-800/30',
    bar: 'from-slate-400 to-slate-300',
  },
  雀傑: {
    text: 'text-emerald-300',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-950/30',
    bar: 'from-emerald-600 to-emerald-300',
  },
  雀豪: {
    text: 'text-cyan-300',
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-950/30',
    bar: 'from-cyan-600 to-cyan-300',
  },
  雀聖: {
    text: 'text-fuchsia-300',
    border: 'border-fuchsia-500/40',
    bg: 'bg-fuchsia-950/30',
    bar: 'from-fuchsia-600 to-fuchsia-300',
  },
  魂天: {
    text: 'text-yellow-300',
    border: 'border-yellow-500/50',
    bg: 'bg-yellow-950/30',
    bar: 'from-yellow-400 to-amber-300',
  },
};

export function RankBadge({ status }: { status: PlayerRankStatus }) {
  const theme = RANK_GROUP_THEME[status.group];
  return (
    <span
      title={`累計収支 ${formatSignedYen(status.cumulativeProfit)}`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide whitespace-nowrap border ${theme.text} ${theme.border} ${theme.bg}`}
    >
      <Gauge className="w-2.5 h-2.5 shrink-0" /> {status.levelName}
    </span>
  );
}
