import { useMemo, useState } from 'react';
import { Filter, History } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { SectionHeader } from '../common/SectionHeader';
import { EmptyState } from '../common/EmptyState';
import { DayCard } from './DayCard';

export function HistorySection() {
  const history = useAppStore((s) => s.history);
  const players = useAppStore((s) => s.players);
  const settings = useAppStore((s) => s.settings);
  const updateDay = useAppStore((s) => s.updateDay);
  const deleteDay = useAppStore((s) => s.deleteDay);
  const currentDayGames = useAppStore((s) => s.currentDayGames);
  const currentSession = useAppStore((s) => s.currentSession);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [month, setMonth] = useState('all');
  const [playerId, setPlayerId] = useState('all');
  const [status, setStatus] = useState<'all' | 'settled' | 'pending'>('all');

  const pendingDate = currentSession?.startedAt ?? new Date().toISOString();
  const months = useMemo(() => [...new Set([...history.map((day) => day.date.slice(0, 7)), ...(currentDayGames.length ? [pendingDate.slice(0, 7)] : [])])].sort().reverse(), [history, currentDayGames.length, pendingDate]);
  const pendingMatches = currentDayGames.length > 0 && (month === 'all' || pendingDate.startsWith(month)) &&
    (playerId === 'all' || currentDayGames.some(game => game.scores.some(score => score.playerId === playerId)));
  const pendingPlayers = players.filter(player => currentDayGames.some(game => game.scores.some(score => score.playerId === player.id)));
  const sorted = useMemo(() => [...history]
    .filter((day) => month === 'all' || day.date.startsWith(month))
    .filter((day) => playerId === 'all' || day.games.some((game) => game.scores.some((score) => score.playerId === playerId)))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [history, month, playerId]);

  if (history.length === 0 && currentDayGames.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader icon={History} title="対戦履歴" accent="cyan" />
        <EmptyState icon={History} message="対戦履歴がありません" hint="精算を保存すると、ここに1日ごとの対戦履歴が表示されます。" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeader icon={History} title="対戦履歴" accent="cyan" />
      <section className="history-filters" aria-label="対戦履歴の絞り込み">
        <div className="filter-title"><Filter size={16} /><span>絞り込み</span></div>
        <label><span>年月</span><select value={month} onChange={(event) => setMonth(event.target.value)}><option value="all">すべて</option>{months.map((value) => <option key={value} value={value}>{value.replace('-', '年')}月</option>)}</select></label>
        <label><span>参加雀士</span><select value={playerId} onChange={(event) => setPlayerId(event.target.value)}><option value="all">すべて</option>{players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select></label>
        <label><span>状態</span><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="all">すべて</option><option value="settled">精算済み</option><option value="pending">未精算</option></select></label>
      </section>
      {(status === 'all' || status === 'pending') && pendingMatches && <section className="pending-history"><strong>{currentSession?.title ?? '本日の対局'}</strong><span className="settlement-status is-pending">未精算 · {currentDayGames.length}半荘</span><p>{pendingPlayers.slice(0, 3).map(player => player.name).join('、')}{pendingPlayers.length > 3 ? ` ほか${pendingPlayers.length - 3}人` : ''}</p><small>「対局入力」の「本日の精算」から保存すると正式な履歴に追加されます。</small></section>}
      <div className="space-y-5">
        {status !== 'pending' && sorted.map((day) => (
          <DayCard
            key={day.id}
            day={day}
            players={players}
            settings={settings}
            isExpanded={expandedId === day.id}
            onToggle={() => setExpandedId(expandedId === day.id ? null : day.id)}
            onUpdateDay={updateDay}
            onDeleteDay={deleteDay}
            historyBefore={history}
          />
        ))}
        {status !== 'pending' && sorted.length === 0 && !(status === 'all' && pendingMatches) && <EmptyState icon={History} message="該当する履歴がありません" hint="絞り込み条件を変更してください。" />}
        {status === 'pending' && !pendingMatches && <EmptyState icon={History} message="該当する未精算の記録はありません" hint="記録中の対局がある場合はここに表示されます。絞り込み条件もご確認ください。" />}
      </div>
    </div>
  );
}
