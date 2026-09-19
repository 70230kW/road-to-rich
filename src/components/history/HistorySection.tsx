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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [month, setMonth] = useState('all');
  const [playerId, setPlayerId] = useState('all');
  const [status, setStatus] = useState<'all' | 'settled' | 'pending'>('all');

  const months = useMemo(() => [...new Set(history.map((day) => day.date.slice(0, 7)))].sort().reverse(), [history]);
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
      {(status === 'all' || status === 'pending') && currentDayGames.length > 0 && <section className="pending-history"><strong>本日の未精算記録</strong><span>{currentDayGames.length}半荘</span><small>「記録」から精算すると正式な履歴に追加されます。</small></section>}
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
          />
        ))}
        {status !== 'pending' && sorted.length === 0 && <EmptyState icon={History} message="該当する履歴がありません" hint="絞り込み条件を変更してください。" />}
        {status === 'pending' && currentDayGames.length === 0 && <EmptyState icon={History} message="未精算の記録はありません" hint="記録中の対局がある場合はここに表示されます。" />}
      </div>
    </div>
  );
}
