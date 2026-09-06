import type { CSSProperties } from 'react';

type ChipColor = 'cyan' | 'fuchsia' | 'emerald' | 'yellow';

interface Particle {
  id: number;
  kind: 'tile' | 'chip';
  left: number;
  size: number;
  duration: number;
  delay: number;
  rotateEnd: number;
  color?: ChipColor;
}

/** 麻雀牌とチップが画面奥からゆっくり降ってくる背景演出。位置や速度は固定値（毎回ランダムだと再レンダー時にちらつくため）。 */
const PARTICLES: Particle[] = [
  { id: 1, kind: 'tile', left: 4, size: 14, duration: 22, delay: 0, rotateEnd: 40 },
  { id: 2, kind: 'chip', left: 14, size: 10, duration: 17, delay: 4, rotateEnd: 200, color: 'cyan' },
  { id: 3, kind: 'tile', left: 24, size: 16, duration: 27, delay: 9, rotateEnd: -60 },
  { id: 4, kind: 'chip', left: 33, size: 11, duration: 19, delay: 2, rotateEnd: 120, color: 'fuchsia' },
  { id: 5, kind: 'tile', left: 43, size: 13, duration: 24, delay: 12, rotateEnd: 80 },
  { id: 6, kind: 'chip', left: 53, size: 10, duration: 16, delay: 6, rotateEnd: -150, color: 'emerald' },
  { id: 7, kind: 'tile', left: 62, size: 15, duration: 28, delay: 1, rotateEnd: -30 },
  { id: 8, kind: 'chip', left: 71, size: 11, duration: 20, delay: 10, rotateEnd: 260, color: 'yellow' },
  { id: 9, kind: 'tile', left: 80, size: 14, duration: 23, delay: 5, rotateEnd: 50 },
  { id: 10, kind: 'chip', left: 89, size: 10, duration: 18, delay: 14, rotateEnd: -90, color: 'cyan' },
  { id: 11, kind: 'chip', left: 96, size: 9, duration: 21, delay: 16, rotateEnd: 300, color: 'fuchsia' },
  { id: 12, kind: 'tile', left: 91, size: 12, duration: 25, delay: 8, rotateEnd: -110 },
];

const CHIP_COLOR_CLASS: Record<ChipColor, string> = {
  cyan: 'border-cyan-400/30 bg-cyan-400/5',
  fuchsia: 'border-fuchsia-400/30 bg-fuchsia-400/5',
  emerald: 'border-emerald-400/30 bg-emerald-400/5',
  yellow: 'border-yellow-400/30 bg-yellow-400/5',
};

export function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-abyss">
      {PARTICLES.map((p) => (
        <span
          key={p.id}
          className={
            p.kind === 'tile'
              ? 'absolute top-0 opacity-0 rounded-[3px] border border-slate-200/10 bg-gradient-to-b from-slate-100/10 to-slate-300/5 animate-tile-fall'
              : `absolute top-0 opacity-0 rounded-full border animate-tile-fall ${CHIP_COLOR_CLASS[p.color!]}`
          }
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.kind === 'tile' ? p.size * 1.3 : p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              '--rotate-end': `${p.rotateEnd}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
