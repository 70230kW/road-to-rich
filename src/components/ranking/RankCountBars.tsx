const BAR_COLORS = ['#facc15', '#cbd5e1', '#d97706', '#fb7185', '#94a3b8', '#64748b'];
const BAR_GLOW = [
  'drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]',
  'drop-shadow-[0_0_10px_rgba(203,213,225,0.5)]',
  'drop-shadow-[0_0_10px_rgba(217,119,6,0.5)]',
  'drop-shadow-[0_0_10px_rgba(251,113,133,0.5)]',
];

const CHART_HEIGHT = 112;

export function RankCountBars({ counts }: { counts: number[] }) {
  const max = Math.max(1, ...counts);

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-5" style={{ height: CHART_HEIGHT + 44 }}>
      {counts.map((count, i) => {
        const barHeight = count === 0 ? 0 : Math.max(6, Math.round((count / max) * CHART_HEIGHT));
        const color = BAR_COLORS[i] ?? '#475569';
        const glow = BAR_GLOW[i] ?? '';
        return (
          <div key={i} className="flex flex-col items-center gap-1.5 w-10 sm:w-12">
            <span className="text-xs sm:text-sm font-mono font-black text-slate-200">{count}</span>
            <div className="flex items-end" style={{ height: CHART_HEIGHT }}>
              <div
                className={`w-8 sm:w-10 rounded-t-md transition-all duration-500 ${glow}`}
                style={{ height: barHeight, backgroundColor: color }}
              />
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 font-mono">{i + 1}着</span>
          </div>
        );
      })}
    </div>
  );
}
