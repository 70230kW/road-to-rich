import type { DayRecord } from '../../types';
import { SaveReceipt } from './SaveReceipt';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { HanchanForm } from './HanchanForm';
import { SettlementForm } from './SettlementForm';
import { MatchSessionPanel } from './MatchSessionPanel';
import { haptic } from '../../lib/haptics';
import { ResultShareButton } from '../share/ResultShareButton';

export function InputSection({ onNavigateToPlayers, startSettling = false }: { onNavigateToPlayers: () => void; startSettling?: boolean }) {
  const players = useAppStore((s) => s.players);
  const settings = useAppStore((s) => s.settings);
  const currentDayGames = useAppStore((s) => s.currentDayGames);
  const addGame = useAppStore((s) => s.addGame);
  const removeGame = useAppStore((s) => s.removeGame);
  const updateGameYakuman = useAppStore((s) => s.updateGameYakuman);
  const finalizeDay = useAppStore((s) => s.finalizeDay);
  const setPlayerCount = useAppStore((s) => s.setPlayerCount);
  const currentSession = useAppStore((s) => s.currentSession);
  const roomCode = useAppStore((s) => s.roomCode);

  const [savedDay, setSavedDay] = useState<{ day: Omit<DayRecord, 'id' | 'date'>; title: string } | null>(null);
  const [isSettling, setIsSettling] = useState(startSettling);

  if (savedDay) {
    const rows = Object.entries(savedDay.day.settlement).map(([id, entry]) => ({ id, name: players.find(p => p.id === id)?.name ?? '不明', profit: entry.totalWithFee, color: players.find(p => p.id === id)?.color }));
    return <div className="space-y-5"><SaveReceipt title="精算を保存しました" detail={`${savedDay.title} · チップ・場代を含む最終収支`} rows={rows} onNext={() => setSavedDay(null)} nextLabel="次の対局を記録" /><ResultShareButton title={savedDay.title} date={new Date().toLocaleDateString('ja-JP')} rows={rows} hanchanCount={savedDay.day.games.length} /></div>;
  }
  if (isSettling) {
    return (
      <SettlementForm
        players={players}
        currentDayGames={currentDayGames}
        onCancel={() => setIsSettling(false)}
        onSave={async (day) => {
          if (!useAppStore.getState().roomCode) throw new Error('Room disconnected');
          const title = currentSession?.title ?? '本日の対局';
          await finalizeDay(day);
          haptic('success');
          setSavedDay({ day, title });
          setIsSettling(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-7">
    <MatchSessionPanel onSettle={() => setIsSettling(true)} />
    <HanchanForm
      players={players}
      settings={settings}
      currentDayGames={currentDayGames}
      onAddGame={async game => { if (!useAppStore.getState().roomCode) throw new Error('Room disconnected'); return addGame(game); }}
      onRemoveGame={removeGame}
      onUpdateGameYakuman={updateGameYakuman}
      onStartSettling={() => setIsSettling(true)}
      onNavigateToPlayers={onNavigateToPlayers}
      onSetPlayerCount={setPlayerCount}
      eligiblePlayerIds={currentSession?.participantIds}
      draftKey={roomCode ? `road-to-rich-hanchan-draft:${roomCode}` : undefined}
    />
    </div>
  );
}
