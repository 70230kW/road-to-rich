import { useMemo } from 'react';
import { Crown, Gamepad2, TrendingUp, Zap } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { computeRanking } from '../../lib/stats';
import { formatSignedYen } from '../../lib/format';
import { SectionHeader } from '../common/SectionHeader';
import { EmptyState } from '../common/EmptyState';

const RANK_STYLES = [
  {
    text: 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]',
    border: 'border-yellow-500/40 bg-yellow-950/10',
    glow: 'shadow-[0_0_30px_rgba(250,204,21,0.15)]',
    bar: 'bg-gradient-to-b from-yellow-400 to-amber-600',
  },
  {
    text: 'text-slate-300 drop-shadow-[0_0_10px_rgba(203,213,225,0.8)]',
    border: 'border-slate-400/40 bg-slate-900/40',
    glow: '',
    bar: 'bg-gradient-to-b from-slate-300 to-slate-500',
  },
  {
    text: 'text-amber-600 drop-shadow-[0_0_10px_rgba(217,119,6,0.8)]',
    border: 'border-amber-700/40 bg-amber-950/10',
    glow: '',
    bar: 'bg-gradient-to-b from-amber-600 to-amber-800',
  },
];

export function RankingSection() {
  const history = useAppStore((s) => s.history);
  const players = useAppStore((s) => s.players);
  const rows = useMemo(() => computeRanking(history, players), [history, players]);

  if (rows.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader icon={Crown} title="総合ランキング" accent="yellow" />
        <EmptyState icon={Crown} message="No Ranking Data" hint="精算を保存すると、雀士ごとの累計成績が表示されます。" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeader icon={Crown} title="総合ランキング" accent="yellow" />

      <div className="space-y-5">
        {rows.map((row, idx) => {
          const style = RANK_STYLES[idx] ?? { text: 'text-slate-600', border: 'border-slate-800/80', glow: '', bar: 'bg-slate-800' };
          return (
            <div
              key={row.playerId}
              className={`bg-panel-2/70 p-5 rounded-[2rem] border ${style.border} ${style.glow} flex flex-col md:flex-row md:items-center relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300 backdrop-blur-md`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-2 transition-colors ${style.bar}`} />

              <div className={`w-16 md:w-20 text-center font-black text-3xl md:text-4xl italic md:mr-6 mb-4 md:mb-0 ${style.text} font-mono tracking-tighter`}>
                #{idx + 1}
              </div>

              <div className="flex-1 space-y-2">
                <div className="font-black text-xl md:text-2xl text-slate-100 tracking-wider">{row.name}</div>
                <div className="flex flex-wrap gap-2 md:gap-3 text-xs text-slate-400 font-mono font-bold">
                  <span className="flex items-center bg-abyss px-3 py-1.5 rounded-lg border border-slate-800">
                    <Gamepad2 className="w-3 h-3 mr-1.5 text-cyan-500" />
                    半荘: <span className="text-slate-200 ml-1.5">{row.hanchanCount}</span>
                  </span>
                  <span className="flex items-center bg-abyss px-3 py-1.5 rounded-lg border border-slate-800">
                    <TrendingUp className="w-3 h-3 mr-1.5 text-fuchsia-500" />
                    平均着順: <span className="text-slate-200 ml-1.5">{row.avgRank !== null ? row.avgRank.toFixed(2) : '-'}</span>
                  </span>
                  <span className="flex items-center bg-abyss px-3 py-1.5 rounded-lg border border-slate-800">
                    <Zap className="w-3 h-3 mr-1.5 text-yellow-500" />
                    平均チップ:
                    <span className={`ml-1.5 ${(row.avgChips ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {row.avgChips !== null ? `${row.avgChips > 0 ? '+' : ''}${row.avgChips.toFixed(2)}` : '-'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="mt-4 md:mt-0 text-right md:pl-6">
                <div className="text-[10px] font-black text-slate-500 mb-1 tracking-[0.2em] uppercase">Total Profit</div>
                <div
                  className={`font-mono text-2xl md:text-4xl font-black ${
                    row.totalProfit >= 0 ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]' : 'text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                  }`}
                >
                  {formatSignedYen(row.totalProfit)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
