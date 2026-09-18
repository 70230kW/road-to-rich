import type { DayRecord } from '../../types';
import { SaveReceipt } from './SaveReceipt';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { HanchanForm } from './HanchanForm';
import { SettlementForm } from './SettlementForm';

export function InputSection({ onNavigateToPlayers, startSettling = false }: { onNavigateToPlayers: () => void; startSettling?: boolean }) {
  const players = useAppStore((s) => s.players);
  const settings = useAppStore((s) => s.settings);
  const currentDayGames = useAppStore((s) => s.currentDayGames);
  const addGame = useAppStore((s) => s.addGame);
  const removeGame = useAppStore((s) => s.removeGame);
  const updateGameYakuman = useAppStore((s) => s.updateGameYakuman);
  const finalizeDay = useAppStore((s) => s.finalizeDay);
  const setPlayerCount = useAppStore((s) => s.setPlayerCount);

  const [savedDay, setSavedDay] = useState<Omit<DayRecord, 'id' | 'date'> | null>(null);
  const [isSettling, setIsSettling] = useState(startSettling);

  if (savedDay) return <SaveReceipt title="精算を保存しました" detail="チップ・場代を含む本日の収支" rows={Object.entries(savedDay.settlement).map(([id, entry]) => ({ id, name: players.find(p => p.id === id)?.name ?? '不明', profit: entry.totalWithFee }))} onNext={() => setSavedDay(null)} nextLabel="次の対局を記録" />;
  if (isSettling) {
    return (
      <SettlementForm
        players={players}
        currentDayGames={currentDayGames}
        onCancel={() => setIsSettling(false)}
        onSave={async (day) => {
          if (!useAppStore.getState().roomCode) throw new Error('Room disconnected');
          await finalizeDay(day);
          setSavedDay(day);
          setIsSettling(false);
        }}
      />
    );
  }

  return (
    <HanchanForm
      players={players}
      settings={settings}
      currentDayGames={currentDayGames}
      onAddGame={async game => { if (!useAppStore.getState().roomCode) throw new Error('Room disconnected'); await addGame(game); }}
      onRemoveGame={removeGame}
      onUpdateGameYakuman={updateGameYakuman}
      onStartSettling={() => setIsSettling(true)}
      onNavigateToPlayers={onNavigateToPlayers}
      onSetPlayerCount={setPlayerCount}
    />
  );
}

