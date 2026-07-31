import { useState } from 'react';
import { History } from 'lucide-react';
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (history.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader icon={History} title="対戦履歴" accent="cyan" />
        <EmptyState icon={History} message="No Data" hint="精算を保存すると、ここに1日ごとの対戦履歴が表示されます。" />
      </div>
    );
  }

  const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeader icon={History} title="対戦履歴" accent="cyan" />
      <div className="space-y-5">
        {sorted.map((day) => (
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
      </div>
    </div>
  );
}
