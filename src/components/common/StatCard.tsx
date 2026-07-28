import { cloneElement, type ReactElement } from 'react';

type Color = 'cyan' | 'fuchsia' | 'yellow' | 'emerald';

const colorMap: Record<Color, string> = {
  cyan: 'text-cyan-400 bg-[#0a192f]/60 border-cyan-800/60 shadow-[0_4px_20px_rgba(6,182,212,0.15)]',
  fuchsia: 'text-fuchsia-400 bg-fuchsia-950/20 border-fuchsia-800/60 shadow-[0_4px_20px_rgba(232,121,249,0.15)]',
  yellow: 'text-yellow-400 bg-yellow-950/20 border-yellow-800/60 shadow-[0_4px_20px_rgba(250,204,21,0.15)]',
  emerald: 'text-emerald-400 bg-emerald-950/20 border-emerald-800/60 shadow-[0_4px_20px_rgba(52,211,153,0.15)]',
};

const textMap: Record<Color, string> = {
  cyan: 'text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]',
  fuchsia: 'text-fuchsia-300 drop-shadow-[0_0_10px_rgba(232,121,249,0.8)]',
  yellow: 'text-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]',
  emerald: 'text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]',
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
      className={`p-5 rounded-3xl border flex flex-col justify-between relative overflow-hidden group transition-all duration-500 hover:scale-[1.02] ${colorMap[color]} backdrop-blur-sm`}
    >
      <div className="absolute top-0 right-0 -mt-2 -mr-2 opacity-10 group-hover:opacity-20 transition-opacity duration-500 group-hover:scale-125 transform">
        {cloneElement(icon, { className: 'w-20 h-20' })}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="text-xs font-black text-slate-400 mb-2 tracking-[0.15em] z-10 uppercase">{title}</div>
      <div className={`text-lg sm:text-2xl md:text-3xl font-black font-mono z-10 ${textMap[color]}`}>{value}</div>
      {sub && (
        <div className="text-[10px] md:text-xs text-slate-400 font-bold mt-2 z-10 uppercase tracking-widest truncate flex items-center">
          <span className="w-1 h-1 rounded-full bg-current mr-1.5 opacity-50" />
          BY {sub}
        </div>
      )}
    </div>
  );
}
