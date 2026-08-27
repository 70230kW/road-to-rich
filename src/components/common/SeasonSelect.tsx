import { ChevronDown } from 'lucide-react';
import type { SeasonFilter } from '../../lib/season';

type Accent = 'cyan' | 'yellow' | 'fuchsia' | 'emerald';

const accentClass: Record<Accent, string> = {
  cyan: 'focus:border-cyan-400 focus:ring-cyan-400/50',
  yellow: 'focus:border-yellow-400 focus:ring-yellow-400/50',
  fuchsia: 'focus:border-fuchsia-400 focus:ring-fuchsia-400/50',
  emerald: 'focus:border-emerald-400 focus:ring-emerald-400/50',
};

const accentIconClass: Record<Accent, string> = {
  cyan: 'text-cyan-500/70',
  yellow: 'text-yellow-500/70',
  fuchsia: 'text-fuchsia-500/70',
  emerald: 'text-emerald-500/70',
};

/** シーズン（年）選択プルダウン。「通算」+ history に含まれる年ごとの選択肢を表示する。 */
export function SeasonSelect({
  season,
  onChange,
  seasons,
  accent = 'cyan',
}: {
  season: SeasonFilter;
  onChange: (season: SeasonFilter) => void;
  seasons: number[];
  accent?: Accent;
}) {
  return (
    <div className="relative shrink-0">
      <select
        value={season === 'all' ? 'all' : String(season)}
        onChange={(e) => onChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
        aria-label="シーズンを選択"
        className={`bg-abyss border border-slate-700/80 rounded-xl pl-4 pr-9 py-2 text-slate-100 focus:outline-none focus:ring-1 font-bold text-xs sm:text-sm appearance-none transition-all cursor-pointer tracking-wide shadow-inner ${accentClass[accent]}`}
      >
        <option value="all">通算</option>
        {seasons.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${accentIconClass[accent]}`} />
    </div>
  );
}
