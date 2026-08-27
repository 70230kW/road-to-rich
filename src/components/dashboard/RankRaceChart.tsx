import { useState } from 'react';
import type { RankRaceSeries } from '../../lib/rankRace';

const SVG_WIDTH = 800;
const SVG_HEIGHT = 400;
const PAD_X = 60;
const PAD_Y = 40;
const PAD_RIGHT = 90;
const CHART_W = SVG_WIDTH - PAD_X - PAD_RIGHT;
const CHART_H = SVG_HEIGHT - PAD_Y * 2;

export function RankRaceChart({ series }: { series: RankRaceSeries }) {
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

  const maxRank = Math.max(1, activePlayers.length);
  const getX = (index: number) => PAD_X + (index / Math.max(1, points.length - 1)) * CHART_W;
  const getY = (rank: number) => (maxRank <= 1 ? PAD_Y + CHART_H / 2 : PAD_Y + ((rank - 1) / (maxRank - 1)) * CHART_H);

  const lastIndex = points.length - 1;

  return (
    <div className="pb-4">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full h-auto drop-shadow-[0_0_20px_rgba(232,121,249,0.15)]"
        role="img"
        aria-label="順位レースグラフ"
      >
        <defs>
          <filter id="rank-line-glow" x="-20%" y="-20%" width="140%" height="140%">
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
        {Array.from({ length: maxRank }).map((_, i) => {
          const rank = i + 1;
          const y = getY(rank);
          return (
            <g key={`h-${rank}`}>
              <line x1={PAD_X} y1={y} x2={SVG_WIDTH - PAD_RIGHT} y2={y} stroke="#1e293b" strokeWidth="1" opacity="0.8" />
              <text x={PAD_X - 12} y={y + 4} fill="#94a3b8" fontSize="11" textAnchor="end" fontFamily="var(--font-mono)" fontWeight="700">
                {rank}位
              </text>
            </g>
          );
        })}

        {points.map((pt, i) => {
          if (i === 0 || i === lastIndex || i % Math.ceil(points.length / 6) === 0) {
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

        {activePlayers.map((p) => {
          if (hiddenIds.has(p.id)) return null;
          const color = p.color;
          const pointsStr = points.map((pt, i) => `${getX(i)},${getY(pt.ranks[p.id] ?? maxRank)}`).join(' ');
          const finalRank = points[lastIndex]?.ranks[p.id] ?? maxRank;
          return (
            <g key={p.id}>
              <polyline points={pointsStr} fill="none" stroke={color} strokeWidth="3.5" filter="url(#rank-line-glow)" />
              {points.map((pt, i) => (
                <circle key={`c-${p.id}-${i}`} cx={getX(i)} cy={getY(pt.ranks[p.id] ?? maxRank)} r="4" fill={color} stroke={color} strokeWidth="2.5">
                  <title>{`${p.name}: ${pt.ranks[p.id] ?? maxRank}位`}</title>
                </circle>
              ))}
              <text
                x={getX(lastIndex) + 10}
                y={getY(finalRank) + 4}
                fill={color}
                fontSize="12"
                fontWeight="900"
                fontFamily="var(--font-mono)"
              >
                {p.name}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 mt-8 pt-6 border-t border-slate-700/50">
        {activePlayers.map((p) => {
          const isHidden = hiddenIds.has(p.id);
          const color = p.color;
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
