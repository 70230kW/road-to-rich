import type { DayRecord } from '../../types';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { HanchanForm } from './HanchanForm';
import { SettlementForm } from './SettlementForm';
import { MatchSessionPanel } from './MatchSessionPanel';
import { haptic } from '../../lib/haptics';
import { MatchResultSequence } from './MatchResultSequence';

export function InputSection({ onNavigateToPlayers, onResultComplete, startSettling = false }: { onNavigateToPlayers: () => void; onResultComplete: () => void; startSettling?: boolean }) {
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

  const [savedDay, setSavedDay] = useState<{ day: DayRecord; title: string; historyBefore: DayRecord[] } | null>(null);
  const [isSettling, setIsSettling] = useState(startSettling);

  if (savedDay) {
    return <MatchResultSequence title={savedDay.title} resultDay={savedDay.day} historyBefore={savedDay.historyBefore} players={players} settings={settings} onComplete={onResultComplete} />;
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
          const historyBefore = useAppStore.getState().history;
          const completedDay: DayRecord = { ...day, id: `result-${Date.now()}`, date: new Date().toISOString(), ...(currentSession ? { session: currentSession } : {}) };
          await finalizeDay(day);
          haptic('success');
          setSavedDay({ day: completedDay, title, historyBefore });
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
