import { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import type { DayRecord } from '../../types';
import { computeActivityCalendarData } from '../../lib/activityCalendar';
import { ActivityCalendarHeatmap } from './ActivityCalendarHeatmap';

export function ActivityCalendarSection({ history }: { history: DayRecord[] }) {
  const { years, activityByDate, daysPlayedByYear } = useMemo(() => computeActivityCalendarData(history), [history]);

  if (years.length === 0) return null;

  return (
    <div className="bg-panel-2/80 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden group hover:border-emerald-800/80 transition-colors duration-500 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <h3 className="text-sm font-black text-emerald-400 mb-6 flex items-center tracking-[0.2em] uppercase">
        <CalendarDays className="w-5 h-5 mr-2" /> 対局カレンダー
        <span className="text-slate-500 ml-2 font-normal text-xs normal-case">(Activity)</span>
      </h3>
      <div className="space-y-8">
        {years.map((year) => (
          <div key={year}>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="font-mono font-black text-slate-300 text-sm">{year}</span>
              <span className="font-mono text-xs text-slate-500">{daysPlayedByYear.get(year) ?? 0}日プレー</span>
            </div>
            <ActivityCalendarHeatmap year={year} activity={activityByDate} />
          </div>
        ))}
      </div>
    </div>
  );
}
