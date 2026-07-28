import type { ComponentType, ReactNode } from 'react';

type Accent = 'cyan' | 'fuchsia' | 'yellow' | 'emerald';

const accentGradient: Record<Accent, string> = {
  cyan: 'from-cyan-100 to-cyan-400',
  fuchsia: 'from-fuchsia-100 to-fuchsia-400',
  yellow: 'from-yellow-200 to-amber-500',
  emerald: 'from-emerald-100 to-emerald-400',
};

const accentIcon: Record<Accent, string> = {
  cyan: 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]',
  fuchsia: 'text-fuchsia-400 drop-shadow-[0_0_10px_rgba(232,121,249,0.8)]',
  yellow: 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]',
  emerald: 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]',
};

const accentUnderline: Record<Accent, string> = {
  cyan: 'from-cyan-400 to-transparent',
  fuchsia: 'from-fuchsia-400 to-transparent',
  yellow: 'from-yellow-500 to-transparent',
  emerald: 'from-emerald-400 to-transparent',
};

export function SectionHeader({
  icon: Icon,
  title,
  accent = 'cyan',
  trailing,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  accent?: Accent;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-700/50 pb-5 relative">
      <h2
        className={`text-2xl md:text-3xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r ${accentGradient[accent]} flex items-center tracking-wider`}
      >
        <Icon className={`w-7 h-7 md:w-8 md:h-8 mr-3 shrink-0 ${accentIcon[accent]}`} />
        {title}
      </h2>
      {trailing}
      <div className={`absolute -bottom-[1px] left-0 w-32 h-[2px] bg-gradient-to-r ${accentUnderline[accent]}`} />
    </div>
  );
}
