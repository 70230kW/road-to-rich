import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useViewContext, type PeriodChoice } from '../../store/useViewPreferences';
import { getAvailableSeasons, formatSeasonLabel } from '../../lib/season';
import { SeasonSelect } from './SeasonSelect';
const choices: [PeriodChoice, string][] = [['month','今月'],['previousMonth','先月'],['year','今年'],['all','通算']];
export function PeriodFilter() {
  const { season, period, setPeriod, setSeason } = useViewContext();
  const history = useAppStore(s => s.history);
  const [expanded, setExpanded] = useState(period === 'custom');
  const year = new Date().getFullYear();
  const years = [...new Set([year, year - 1, ...getAvailableSeasons(history)])].sort((a,b) => b-a);
  return <div className="period-filter">
    <div className="period-buttons" role="group" aria-label="集計期間">
      {choices.map(([id,label]) => <button key={id} type="button" aria-pressed={period === id} onClick={() => setPeriod(id)}>{label}</button>)}
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>年月指定</button>
    </div>
    <div className="period-detail"><span>表示期間：{formatSeasonLabel(season)}</span>{expanded && <SeasonSelect season={season} onChange={setSeason} seasons={years} />}</div>
  </div>;
}
