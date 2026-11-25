import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useViewContext, type PeriodChoice } from '../../store/useViewPreferences';
import { getAvailableSeasons, formatSeasonLabel } from '../../lib/season';
import { SeasonSelect } from './SeasonSelect';
const choices: [PeriodChoice, string][] = [['month','今月'],['previousMonth','先月'],['year','今年'],['all','通算']];
export function PeriodFilter() {
  const { season, period, setPeriod, setSeason } = useViewContext();
  const history = useAppStore(s => s.history);
  const [expanded, setExpanded] = useState(false);
  const year = new Date().getFullYear();
  const years = [...new Set([year, year - 1, ...getAvailableSeasons(history)])].sort((a,b) => b-a);
  const choose = (value: string) => {
    if (value === 'custom') setExpanded(true);
    else { setExpanded(false); setPeriod(value as PeriodChoice); }
  };
  return <div className="period-filter" aria-label="表示期間フィルター">
    <label className="period-mobile-choice"><span className="sr-only">集計期間を選択</span><select value={expanded ? 'custom' : period} onChange={event => choose(event.target.value)}>{choices.map(([id, label]) => <option key={id} value={id}>{label}</option>)}<option value="custom">年月指定</option></select></label>
    <div className="period-buttons" role="group" aria-label="集計期間">
      {choices.map(([id,label]) => <button key={id} type="button" aria-pressed={period === id} onClick={() => choose(id)}>{label}</button>)}
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>年月指定</button>
    </div>
    <div className="period-detail">{period === 'custom' ? <button className="period-edit-custom" type="button" aria-label={`年月を変更（${formatSeasonLabel(season)}）`} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{formatSeasonLabel(season)} <span aria-hidden="true">▾</span></button> : <span>表示期間：{formatSeasonLabel(season)}</span>}{expanded && <div className="period-custom"><SeasonSelect season={season} onChange={value => { setSeason(value); setExpanded(false); }} seasons={years} /><button type="button" onClick={() => setExpanded(false)}>閉じる</button></div>}</div>
  </div>;
}
