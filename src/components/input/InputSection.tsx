import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { HanchanForm } from './HanchanForm';
import { SettlementForm } from './SettlementForm';

export function InputSection({ onNavigateToPlayers }: { onNavigateToPlayers: () => void }) {
  const players = useAppStore((s) => s.players);
  const settings = useAppStore((s) => s.settings);
  const currentDayGames = useAppStore((s) => s.currentDayGames);
  const addGame = useAppStore((s) => s.addGame);
  const removeGame = useAppStore((s) => s.removeGame);
  const finalizeDay = useAppStore((s) => s.finalizeDay);

  const [isSettling, setIsSettling] = useState(false);

  if (isSettling) {
    return (
      <SettlementForm
        players={players}
        currentDayGames={currentDayGames}
        onCancel={() => setIsSettling(false)}
        onSave={(day) => {
          finalizeDay(day);
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
      onAddGame={addGame}
      onRemoveGame={removeGame}
      onStartSettling={() => setIsSettling(true)}
      onNavigateToPlayers={onNavigateToPlayers}
    />
  );
}
