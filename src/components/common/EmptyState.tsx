import type { ComponentType } from 'react';

export function EmptyState({
  icon: Icon,
  message = 'NO DATA',
  hint,
}: {
  icon: ComponentType<{ className?: string }>;
  message?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 md:py-32 text-slate-500 relative">
      <div className="absolute w-40 h-40 bg-cyan-500/5 blur-[60px] rounded-full" />
      <Icon className="w-14 h-14 md:w-16 md:h-16 mb-5 opacity-50 relative z-10" />
      <p className="font-black tracking-[0.3em] uppercase text-sm md:text-base opacity-70 relative z-10 font-mono">
        {message}
      </p>
      {hint && <p className="mt-3 text-xs md:text-sm text-slate-600 relative z-10 max-w-sm text-center">{hint}</p>}
    </div>
  );
}
