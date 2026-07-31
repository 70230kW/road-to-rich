import { useState } from 'react';
import { Pencil } from 'lucide-react';
import type { DayRecord, Game, Player, Settings } from '../../types';
import { NeonButton } from '../common/NeonButton';
import { HanchanForm } from '../input/HanchanForm';
import { SettlementForm } from '../input/SettlementForm';

function uid(): string {
  return crypto.randomUUID();
}

export function DayEditor({
  day,
  players,
  settings,
  onCancel,
  onSave,
}: {
  day: DayRecord;
  players: Player[];
  settings: Settings;
  onCancel: () => void;
  onSave: (patch: Omit<DayRecord, 'id' | 'date'>) => void;
}) {
  const [games, setGames] = useState<Game[]>(day.games);
  const [step, setStep] = useState<'games' | 'settlement'>('games');

  const addGame = (game: Omit<Game, 'id'>) => setGames((prev) => [...prev, { ...game, id: uid() }]);
  const removeGame = (gameId: string) => setGames((prev) => prev.filter((g) => g.id !== gameId));

  if (step === 'settlement') {
    return (
      <SettlementForm
        players={players}
        currentDayGames={games}
        initialTableFee={day.tableFee}
        initialChipRate={day.chipRate}
        initialChips={day.chips}
        saveLabel="変更を保存する"
        onCancel={() => setStep('games')}
        onSave={onSave}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl px-5 py-3.5">
        <span className="flex items-center text-xs font-black text-amber-400 tracking-[0.2em] uppercase">
          <Pencil className="w-4 h-4 mr-2" /> 対戦履歴を編集中
        </span>
        <NeonButton variant="ghost" onClick={onCancel} className="px-4 py-2 text-xs">
          編集をやめる
        </NeonButton>
      </div>
      <HanchanForm
        players={players}
        settings={settings}
        currentDayGames={games}
        onAddGame={addGame}
        onRemoveGame={removeGame}
        onStartSettling={() => setStep('settlement')}
        onNavigateToPlayers={onCancel}
      />
    </div>
  );
}
