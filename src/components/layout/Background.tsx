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
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d415_1px,transparent_1px),linear-gradient(to_bottom,#06b6d415_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] animate-grid-scroll" />
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-cyan-900/20 via-blue-900/5 to-transparent" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full mix-blend-screen animate-blob-drift [animation-duration:15s]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-600/10 blur-[120px] rounded-full mix-blend-screen animate-blob-drift [animation-duration:19s] [animation-delay:-7s] [animation-direction:reverse]" />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[30%] h-[30%] bg-emerald-600/5 blur-[140px] rounded-full mix-blend-screen animate-blob-drift [animation-duration:23s] [animation-delay:-3s]" />

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
