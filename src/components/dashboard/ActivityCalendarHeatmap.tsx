import { useMemo } from 'react';

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

interface DayCell {
  date: Date;
  key: string;
  count: number;
  inYear: boolean;
}

function intensityClass(count: number): string {
  if (count === 0) return 'bg-slate-800/50';
  if (count === 1) return 'bg-cyan-900';
  if (count <= 3) return 'bg-cyan-700';
  if (count <= 6) return 'bg-cyan-500';
  return 'bg-cyan-300 shadow-[0_0_6px_rgba(34,211,238,0.8)]';
}

function buildWeeks(year: number, activity: Map<string, number>): DayCell[][] {
  const start = new Date(Date.UTC(year, 0, 1));
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const end = new Date(Date.UTC(year, 11, 31));
  end.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay()));

  const weeks: DayCell[][] = [];
  let week: DayCell[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const key = cursor.toISOString().slice(0, 10);
    week.push({
      date: new Date(cursor),
      key,
      count: activity.get(key) ?? 0,
      inYear: cursor.getUTCFullYear() === year,
    });
    if (cursor.getUTCDay() === 6) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) weeks.push(week);
  return weeks;
}

function monthLabelForWeek(week: DayCell[]): string | null {
  const firstOfMonth = week.find((d) => d.inYear && d.date.getUTCDate() === 1);
  return firstOfMonth ? MONTH_LABELS[firstOfMonth.date.getUTCMonth()] : null;
}

/** 1年分のGitHub風活動ヒートマップ。 */
export function ActivityCalendarHeatmap({ year, activity }: { year: number; activity: Map<string, number> }) {
  const weeks = useMemo(() => buildWeeks(year, activity), [year, activity]);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="inline-flex gap-[3px]">
        <div className="flex flex-col gap-[3px] mr-1 pt-[18px] shrink-0">
          {DAY_LABELS.map((label, i) => (
            <div
              key={label}
              className="h-[11px] sm:h-[13px] w-4 text-[8px] sm:text-[9px] text-slate-600 font-mono leading-[11px] sm:leading-[13px]"
            >
              {i % 2 === 1 ? label : ''}
            </div>
          ))}
        </div>
        <div className="flex gap-[3px]">
          {weeks.map((week) => (
            <div key={week[0].key} className="flex flex-col gap-[3px]">
              <div className="h-[14px] text-[8px] sm:text-[9px] text-slate-500 font-mono whitespace-nowrap">
                {monthLabelForWeek(week) ?? ''}
              </div>
              {week.map((d) => (
                <div
                  key={d.key}
                  title={d.inYear ? `${d.key}: ${d.count}半荘` : undefined}
                  className={`w-[11px] h-[11px] sm:w-[13px] sm:h-[13px] rounded-[2px] ${d.inYear ? intensityClass(d.count) : 'bg-transparent'}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
