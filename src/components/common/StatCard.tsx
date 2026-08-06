import { cloneElement, type ReactElement } from 'react';

type Color = 'cyan' | 'fuchsia' | 'yellow' | 'emerald' | 'rose' | 'indigo';

const colorMap: Record<Color, string> = {
  cyan: 'text-cyan-400 bg-[#0a192f]/60 border-cyan-800/60 shadow-[0_4px_20px_rgba(6,182,212,0.15)]',
  fuchsia: 'text-fuchsia-400 bg-fuchsia-950/20 border-fuchsia-800/60 shadow-[0_4px_20px_rgba(232,121,249,0.15)]',
  yellow: 'text-yellow-400 bg-yellow-950/20 border-yellow-800/60 shadow-[0_4px_20px_rgba(250,204,21,0.15)]',
  emerald: 'text-emerald-400 bg-emerald-950/20 border-emerald-800/60 shadow-[0_4px_20px_rgba(52,211,153,0.15)]',
  rose: 'text-rose-400 bg-rose-950/20 border-rose-800/60 shadow-[0_4px_20px_rgba(244,63,94,0.15)]',
  indigo: 'text-indigo-400 bg-indigo-950/20 border-indigo-800/60 shadow-[0_4px_20px_rgba(129,140,248,0.15)]',
};

const textMap: Record<Color, string> = {
  cyan: 'text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]',
  fuchsia: 'text-fuchsia-300 drop-shadow-[0_0_10px_rgba(232,121,249,0.8)]',
  yellow: 'text-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]',
  emerald: 'text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]',
  rose: 'text-rose-300 drop-shadow-[0_0_10px_rgba(251,113,133,0.8)]',
  indigo: 'text-indigo-300 drop-shadow-[0_0_10px_rgba(165,180,252,0.8)]',
};

export function StatCard({
  title,
  value,
  sub,
  icon,
  color,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: ReactElement<{ className?: string }>;
  color: Color;
}) {
  return (
    <div
      className={`p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl md:rounded-3xl border flex flex-col justify-between relative overflow-hidden group transition-all duration-500 hover:scale-[1.02] ${colorMap[color]} backdrop-blur-sm min-w-0`}
    >
      <div className="absolute top-0 right-0 -mt-2 -mr-2 opacity-10 group-hover:opacity-20 transition-opacity duration-500 group-hover:scale-125 transform pointer-events-none hidden sm:block">
        {cloneElement(icon, { className: 'w-20 h-20' })}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="text-[9px] sm:text-[11px] md:text-xs font-black text-slate-400 mb-1 sm:mb-2 tracking-[0.05em] sm:tracking-[0.15em] z-10 uppercase truncate">
        {title}
      </div>
      <div className={`text-base sm:text-xl md:text-3xl font-black font-mono z-10 leading-tight break-words ${textMap[color]}`}>
        {value}
      </div>
      {sub && (
        <div className={`text-xs sm:text-base md:text-lg font-black mt-1 sm:mt-1.5 z-10 truncate ${textMap[color]}`}>{sub}</div>
      )}
    </div>
  );
}
