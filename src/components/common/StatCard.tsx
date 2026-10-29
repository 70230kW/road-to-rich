import { cloneElement, type ReactElement } from 'react';
import { ScrambleText } from './ScrambleText';

type Color = 'sky' | 'fuchsia' | 'yellow' | 'emerald' | 'rose' | 'indigo';

const textMap: Record<Color, string> = {
  sky: 'text-sky-300',
  fuchsia: 'text-fuchsia-300',
  yellow: 'text-yellow-300',
  emerald: 'text-emerald-300',
  rose: 'text-rose-300',
  indigo: 'text-indigo-300',
};

export function StatCard({
  title,
  value,
  sub,
  icon,
  color,
  onClick,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: ReactElement<{ className?: string }>;
  color: Color;
  onClick?: () => void;
}) {
  const cardClassName = `editorial-stat w-full text-left flex flex-col justify-between relative min-w-0 ${
    onClick ? 'cursor-pointer' : ''
  }`;

  const content = (
    <>
      <div className="stat-label flex items-center gap-1.5 text-[10px] sm:text-[11px] md:text-xs font-medium text-slate-400 mb-2 tracking-[0.05em]">
        <span aria-hidden="true" className="shrink-0 hidden sm:block">{cloneElement(icon, { className: 'w-3.5 h-3.5' })}</span>
        {title}
      </div>
      <div className={`text-base sm:text-xl md:text-3xl font-black font-mono z-10 leading-tight break-words ${textMap[color]}`}>
        <ScrambleText text={value} />
      </div>
      {sub && (
        <div className={`text-xs sm:text-base md:text-lg font-black mt-1 sm:mt-1.5 z-10 truncate ${textMap[color]}`}><ScrambleText text={sub} /></div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cardClassName}>
        {content}
      </button>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}
