import { useMemo, useState } from 'react';
import { Filter, History } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useViewContext } from '../../store/useViewPreferences';
import { updateRouteQuery, useAppRoute } from '../../store/useNavigation';
import { SectionHeader } from '../common/SectionHeader';
import { EmptyState } from '../common/EmptyState';
import { DayCard } from './DayCard';

const monthOf = (iso: string) => { const date = new Date(iso); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; };
const monthLabel = (month: string) => `${Number(month.slice(0, 4))}年${Number(month.slice(5))}月`;
export function HistorySection() {
  const history = useAppStore(s => s.history);
  const players = useAppStore(s => s.players);
  const settings = useAppStore(s => s.settings);
  const updateDay = useAppStore(s => s.updateDay);
  const deleteDay = useAppStore(s => s.deleteDay);
  const currentDayGames = useAppStore(s => s.currentDayGames);
  const currentSession = useAppStore(s => s.currentSession);
  const { activeId } = useViewContext();
  const { params } = useAppRoute();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const monthParam = params.get('month');
  const month = monthParam && /^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam) ? monthParam : 'all';
  const mine = params.get('scope') === 'mine';
  const requestedPlayer = params.get('player') ?? 'all';
  const playerId = mine ? activeId : players.some(p => p.id === requestedPlayer) ? requestedPlayer : 'all';
  const requestedStatus = params.get('status');
  const status = requestedStatus === 'pending' || requestedStatus === 'settled' ? requestedStatus : 'all';
  const filterKey = `${month}/${playerId}/${status}`;
  const [page, setPage] = useState({ key: filterKey, count: 20 });
  const count = page.key === filterKey ? page.count : 20;
  const pendingDate = currentSession?.startedAt ?? new Date().toISOString();
  const months = useMemo(() => [...new Set([...history.map(day => monthOf(day.date)), ...(currentDayGames.length ? [monthOf(pendingDate)] : []), ...(month !== 'all' ? [month] : [])])].sort().reverse(), [history, currentDayGames.length, pendingDate, month]);
  const pendingMatches = currentDayGames.length > 0 && (month === 'all' || monthOf(pendingDate) === month) && (playerId === 'all' || currentDayGames.some(game => game.scores.some(score => score.playerId === playerId)));
  const pendingPlayers = players.filter(player => currentDayGames.some(game => game.scores.some(score => score.playerId === player.id)));
  const sorted = useMemo(() => [...history]
    .filter(day => month === 'all' || monthOf(day.date) === month)
    .filter(day => playerId === 'all' || day.games.some(game => game.scores.some(score => score.playerId === playerId)))
    .sort((a,b) => Date.parse(b.date) - Date.parse(a.date)), [history, month, playerId]);
  const groups = useMemo(() => {
    const result = new Map<string, typeof sorted>();
    sorted.slice(0, count).forEach(day => { const key = monthOf(day.date); result.set(key, [...(result.get(key) ?? []), day]); });
    return [...result.entries()];
  }, [sorted, count]);
  const reset = () => updateRouteQuery({ month: null, scope: null, player: null, status: null });

  return <div className="history-screen space-y-7 animate-fade-in">
    <SectionHeader icon={History} title="対戦履歴" accent="cyan" />
    <div className="scope-switch" role="group" aria-label="履歴の表示対象"><button type="button" aria-pressed={!mine} onClick={() => updateRouteQuery({ scope: null, player: null })}>リーグ全体</button><button type="button" aria-pressed={mine} onClick={() => updateRouteQuery({ scope: 'mine', player: null })}>自分の対局</button></div>
    <section className="history-filters" aria-label="対戦履歴の絞り込み">
      <div className="filter-title"><Filter size={16} /><span>絞り込み</span></div>
      <label><span>年月</span><select value={month} onChange={event => updateRouteQuery({ month: event.target.value === 'all' ? null : event.target.value })}><option value="all">すべて</option>{months.map(value => <option key={value} value={value}>{monthLabel(value)}</option>)}</select></label>
      <label><span>参加雀士</span><select value={playerId} onChange={event => updateRouteQuery({ player: event.target.value === 'all' ? null : event.target.value, scope: null })}><option value="all">すべて</option>{players.map(player => <option key={player.id} value={player.id}>{player.name}</option>)}</select></label>
      <label><span>状態</span><select value={status} onChange={event => updateRouteQuery({ status: event.target.value === 'all' ? null : event.target.value })}><option value="all">すべて</option><option value="settled">精算済み</option><option value="pending">未精算</option></select></label>
    </section>
    {(status === 'all' || status === 'pending') && pendingMatches && <section className="pending-history"><strong>{currentSession?.title ?? '本日の対局'}</strong><span className="settlement-status is-pending">未精算 · {currentDayGames.length}半荘</span><p>{pendingPlayers.slice(0, pendingPlayers.length <= 4 ? 4 : 3).map(player => player.name).join('、')}{pendingPlayers.length > 4 ? ` ほか${pendingPlayers.length - 3}人` : ''}</p><small>「対局入力」の「本日の精算」から保存すると正式な履歴に追加されます。</small></section>}
    {status !== 'pending' && groups.map(([key, days]) => <section key={key} className="history-month" aria-label={monthLabel(key)}>
      <h3 className="history-month-heading">{monthLabel(key)}<span>{sorted.filter(day => monthOf(day.date) === key).length}回</span></h3>
      {days.map(day => <DayCard key={day.id} day={day} players={players} settings={settings} activePlayerId={activeId} isExpanded={expandedId === day.id} onToggle={() => setExpandedId(expandedId === day.id ? null : day.id)} onUpdateDay={updateDay} onDeleteDay={deleteDay} historyBefore={history} />)}
    </section>)}
    {status !== 'pending' && sorted.length > count && <button type="button" className="history-load-more" onClick={() => setPage({ key: filterKey, count: count + 20 })}>さらに20件表示 <span>（{count} / {sorted.length}件）</span></button>}
    {(!(status !== 'pending' && sorted.length) && !(status !== 'settled' && pendingMatches)) && <div className="period-empty"><EmptyState icon={History} message={history.length === 0 && !currentDayGames.length ? '対戦履歴がありません' : '該当する履歴がありません'} hint="期間・参加雀士・精算状態を変更してください。精算を保存すると履歴に追加されます。" /><button type="button" className="action-primary" onClick={reset}>すべての履歴を見る</button></div>}
  </div>;
}
