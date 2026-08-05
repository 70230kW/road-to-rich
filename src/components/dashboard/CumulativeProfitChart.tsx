import { useMemo, useState } from 'react';
import type { CumulativeSeries } from '../../lib/stats';

const COLORS = ['#06b6d4', '#e879f9', '#34d399', '#fbbf24', '#f87171', '#818cf8', '#a3e635'];

const SVG_WIDTH = 800;
const SVG_HEIGHT = 400;
const PAD_X = 60;
const PAD_Y = 40;
const CHART_W = SVG_WIDTH - PAD_X * 2;
const CHART_H = SVG_HEIGHT - PAD_Y * 2;

export function CumulativeProfitChart({ series }: { series: CumulativeSeries }) {
  const { points, activePlayers } = series;
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { minY, maxY } = useMemo(() => {
    let min = 0;
    let max = 0;
    points.forEach((pt) => {
      activePlayers.forEach((p) => {
        const v = pt.values[p.id] ?? 0;
        if (v > max) max = v;
        if (v < min) min = v;
      });
    });
    const range = max - min || 10000;
    return { minY: min - range * 0.15, maxY: max + range * 0.15 };
  }, [points, activePlayers]);

  const boundedRange = maxY - minY || 1;
  const getX = (index: number) => PAD_X + (index / Math.max(1, points.length - 1)) * CHART_W;
  const getY = (val: number) => SVG_HEIGHT - PAD_Y - ((val - minY) / boundedRange) * CHART_H;
  const yZero = getY(0);

  return (
    <div className="pb-4">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full h-auto drop-shadow-[0_0_20px_rgba(6,182,212,0.15)]"
        role="img"
        aria-label="累計収支推移グラフ"
      >
        <defs>
          <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {points.map((_, i) => (
          <line
            key={`v-${i}`}
            x1={getX(i)}
            y1={PAD_Y}
            x2={getX(i)}
            y2={SVG_HEIGHT - PAD_Y}
            stroke="#1e293b"
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.8"
          />
        ))}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = PAD_Y + (i / 4) * CHART_H;
          return (
            <line key={`h-${i}`} x1={PAD_X} y1={y} x2={SVG_WIDTH - PAD_X} y2={y} stroke="#1e293b" strokeWidth="1" opacity="0.8" />
          );
        })}

        <line x1={PAD_X} y1={yZero} x2={SVG_WIDTH - PAD_X} y2={yZero} stroke="#475569" strokeWidth="2" strokeDasharray="6,6" opacity="0.8" />
        <text x={PAD_X - 12} y={yZero + 4} fill="#94a3b8" fontSize="11" textAnchor="end" fontFamily="var(--font-mono)" fontWeight="700">
          ±0
        </text>
        <text x={PAD_X - 12} y={PAD_Y + 4} fill="#94a3b8" fontSize="11" textAnchor="end" fontFamily="var(--font-mono)">
          {Math.round(maxY).toLocaleString()}
        </text>
        <text x={PAD_X - 12} y={SVG_HEIGHT - PAD_Y + 4} fill="#94a3b8" fontSize="11" textAnchor="end" fontFamily="var(--font-mono)">
          {Math.round(minY).toLocaleString()}
        </text>

        {points.map((pt, i) => {
          if (i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 6) === 0) {
            return (
              <text
                key={`xl-${i}`}
                x={getX(i)}
                y={SVG_HEIGHT - PAD_Y + 24}
                fill="#64748b"
                fontSize="11"
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontWeight="700"
              >
                {pt.label}
              </text>
            );
          }
          return null;
        })}

        {activePlayers.map((p, pIdx) => {
          if (hiddenIds.has(p.id)) return null;
          const color = COLORS[pIdx % COLORS.length];
          const pointsStr = points.map((pt, i) => `${getX(i)},${getY(pt.values[p.id] ?? 0)}`).join(' ');
          return (
            <g key={p.id}>
              <polyline points={pointsStr} fill="none" stroke={color} strokeWidth="3.5" filter="url(#line-glow)" />
              {points.map((pt, i) => (
                <circle key={`c-${p.id}-${i}`} cx={getX(i)} cy={getY(pt.values[p.id] ?? 0)} r="4" fill="#030712" stroke={color} strokeWidth="2.5">
                  <title>{`${p.name}: ${Math.round(pt.values[p.id] ?? 0).toLocaleString()}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 mt-8 pt-6 border-t border-slate-700/50">
        {activePlayers.map((p, pIdx) => {
          const isHidden = hiddenIds.has(p.id);
          const color = COLORS[pIdx % COLORS.length];
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              aria-pressed={!isHidden}
              className={`flex items-center justify-center text-xs font-bold font-mono tracking-wider px-3 py-2 rounded-full border transition-all ${
                isHidden
                  ? 'bg-abyss/20 border-slate-800/60 opacity-40 grayscale'
                  : 'bg-abyss/50 border-slate-800 hover:border-slate-600'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full mr-2.5 shrink-0"
                style={{ backgroundColor: color, boxShadow: isHidden ? 'none' : `0 0 10px ${color}` }}
              />
              <span className="text-slate-200 truncate">{p.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
