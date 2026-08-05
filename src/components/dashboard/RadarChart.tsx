import { useMemo } from 'react';
import type { RadarRow } from '../../lib/stats';
import { formatSignedYen } from '../../lib/format';

const COLORS = ['#06b6d4', '#e879f9', '#34d399', '#fbbf24', '#f87171', '#818cf8', '#a3e635'];

const SIZE = 400;
const CENTER = SIZE / 2;
const MAX_R = 140;
const MIN_R = 24;
const LABEL_R = MAX_R + 34;
const RINGS = 4;

interface Axis {
  key: 'chipTotal' | 'highestScore' | 'avgRankInverted' | 'bestDailyWin' | 'avgRawScore';
  label: string;
  format: (row: RadarRow) => string;
}

const AXES: Axis[] = [
  { key: 'chipTotal', label: 'チップ獲得枚数', format: (r) => `${r.chipTotal > 0 ? '+' : ''}${r.chipTotal}枚` },
  { key: 'highestScore', label: '最高素点', format: (r) => `${r.highestScore.toLocaleString()}点` },
  { key: 'avgRankInverted', label: '平均着順', format: (r) => `${r.avgRank.toFixed(2)}位` },
  { key: 'bestDailyWin', label: '1日最高勝ち額', format: (r) => formatSignedYen(r.bestDailyWin) },
  { key: 'avgRawScore', label: '平均素点', format: (r) => `${Math.round(r.avgRawScore).toLocaleString()}点` },
];

function angleFor(index: number): number {
  return -Math.PI / 2 + (index * 2 * Math.PI) / AXES.length;
}

function pointAt(index: number, radius: number): { x: number; y: number } {
  const angle = angleFor(index);
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
}

export function RadarChart({ rows }: { rows: RadarRow[] }) {
  const ranges = useMemo(
    () =>
      AXES.map((axis) => {
        const values = rows.map((r) => r[axis.key] as number);
        const min = Math.min(...values);
        const max = Math.max(...values);
        return { min, max };
      }),
    [rows],
  );

  const normalize = (axisIdx: number, value: number): number => {
    const { min, max } = ranges[axisIdx];
    if (max === min) return 0.5;
    return (value - min) / (max - min);
  };

  const radiusFor = (axisIdx: number, value: number): number => MIN_R + normalize(axisIdx, value) * (MAX_R - MIN_R);

  const ringPolygon = (ringIdx: number): string => {
    const r = (MAX_R * (ringIdx + 1)) / RINGS;
    return AXES.map((_, i) => {
      const p = pointAt(i, r);
      return `${p.x},${p.y}`;
    }).join(' ');
  };

  return (
    <div>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full h-auto max-w-md mx-auto drop-shadow-[0_0_20px_rgba(6,182,212,0.15)]"
        role="img"
        aria-label="能力レーダーチャート"
      >
        {Array.from({ length: RINGS }).map((_, i) => (
          <polygon key={`ring-${i}`} points={ringPolygon(i)} fill="none" stroke="#1e293b" strokeWidth="1" opacity="0.8" />
        ))}

        {AXES.map((axis, i) => {
          const outer = pointAt(i, MAX_R);
          const label = pointAt(i, LABEL_R);
          return (
            <g key={axis.key}>
              <line x1={CENTER} y1={CENTER} x2={outer.x} y2={outer.y} stroke="#1e293b" strokeWidth="1" opacity="0.8" />
              <text
                x={label.x}
                y={label.y}
                fill="#94a3b8"
                fontSize="11"
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="var(--font-mono)"
              >
                {axis.label}
              </text>
            </g>
          );
        })}

        {rows.map((row, rIdx) => {
          const color = COLORS[rIdx % COLORS.length];
          const points = AXES.map((axis, i) => {
            const p = pointAt(i, radiusFor(i, row[axis.key] as number));
            return `${p.x},${p.y}`;
          }).join(' ');
          return (
            <g key={row.playerId}>
              <polygon points={points} fill={color} fillOpacity="0.12" stroke={color} strokeWidth="2.5" />
              {AXES.map((axis, i) => {
                const p = pointAt(i, radiusFor(i, row[axis.key] as number));
                return (
                  <circle key={`${row.playerId}-${axis.key}`} cx={p.x} cy={p.y} r="3.5" fill="#030712" stroke={color} strokeWidth="2">
                    <title>{`${row.name} / ${axis.label}: ${axis.format(row)}`}</title>
                  </circle>
                );
              })}
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap justify-center gap-x-6 md:gap-x-8 gap-y-3 mt-6 pt-6 border-t border-slate-700/50">
        {rows.map((row, rIdx) => (
          <div
            key={row.playerId}
            className="flex items-center text-xs font-bold font-mono tracking-wider bg-abyss/50 px-4 py-2 rounded-full border border-slate-800"
          >
            <span
              className="w-3 h-3 rounded-full mr-2.5"
              style={{ backgroundColor: COLORS[rIdx % COLORS.length], boxShadow: `0 0 10px ${COLORS[rIdx % COLORS.length]}` }}
            />
            <span className="text-slate-200">{row.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
