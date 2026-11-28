import type { DayRecord } from '../../types';
import { useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { HanchanForm } from './HanchanForm';
import { SettlementForm } from './SettlementForm';
import { MatchSessionPanel } from './MatchSessionPanel';
import { haptic } from '../../lib/haptics';
import { MatchResultSequence } from './MatchResultSequence';
import type { InputMode } from '../../lib/inputMode';

export function InputSection({ onNavigateToPlayers, onResultComplete, initialMode = 'single', onModeChange }: { onNavigateToPlayers: () => void; onResultComplete: () => void; initialMode?: InputMode; onModeChange?: (mode: InputMode) => void }) {
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
  const finalizationId = useRef(crypto.randomUUID());
  const [localMode, setLocalMode] = useState<InputMode>(initialMode);
  const requestedMode = onModeChange ? initialMode : localMode;
  const setMode = (value: InputMode) => onModeChange ? onModeChange(value) : setLocalMode(value);
  const mode = requestedMode === 'settle' && currentDayGames.length === 0 ? 'single' : requestedMode;

  if (savedDay) {
    return <MatchResultSequence title={savedDay.title} resultDay={savedDay.day} historyBefore={savedDay.historyBefore} players={players} settings={settings} onComplete={onResultComplete} />;
  }
  if (mode === 'settle' && currentDayGames.length > 0) {
    return (
      <SettlementForm
        players={players}
        currentDayGames={currentDayGames}
        onCancel={() => setMode('single')}
        onSave={async (day) => {
          if (!useAppStore.getState().roomCode) throw new Error('Room disconnected');
          const title = currentSession?.title ?? '本日の対局';
          const historyBefore = useAppStore.getState().history;
          const completedDay: DayRecord = { ...day, id: `result-${Date.now()}`, date: new Date().toISOString(), ...(currentSession ? { session: currentSession } : {}) };
          await finalizeDay(day, finalizationId.current);
          haptic('success');
          setSavedDay({ day: completedDay, title, historyBefore });
        }}
      />
    );
  }

  return (
    <div className="input-workspace space-y-7">
    <nav className="input-mode-switch" aria-label="対局入力の方法">
      <button type="button" aria-pressed={mode === 'single'} onClick={() => setMode('single')}>{currentSession ? '半荘を記録' : '1半荘だけ記録'}</button>
      <button type="button" aria-pressed={mode === 'session'} onClick={() => setMode('session')}>{currentSession ? '対局会を管理' : '対局会を開始'}</button>
      <button type="button" aria-pressed={mode === 'settle'} disabled={currentDayGames.length === 0} onClick={() => setMode('settle')}>本日の精算{currentDayGames.length > 0 && `（${currentDayGames.length}半荘）`}</button>
    </nav>
    {mode === 'session' ? <>
      <MatchSessionPanel onStarted={() => setMode('single')} onSettle={() => setMode('settle')} />
      {currentSession && <button type="button" className="league-action league-action-primary" onClick={() => setMode('single')}>次の半荘を記録</button>}
    </> : <>
    <p className="input-mode-hint">{currentSession ? `「${currentSession.title}」に記録します。参加者の設定は「対局会を管理」から変更できます。` : '対局会の設定は不要です。1半荘を記録した後、「本日の精算」で収支を確定できます。'}</p>
    <HanchanForm
      players={players}
      settings={settings}
      currentDayGames={currentDayGames}
      onAddGame={async game => { if (!useAppStore.getState().roomCode) throw new Error('Room disconnected'); return addGame(game); }}
      onRemoveGame={removeGame}
      onUpdateGameYakuman={updateGameYakuman}
      onStartSettling={() => setMode('settle')}
      onNavigateToPlayers={onNavigateToPlayers}
      onSetPlayerCount={setPlayerCount}
      sessionTitle={currentSession?.title}
      eligiblePlayerIds={currentSession?.participantIds}
      draftKey={roomCode ? `road-to-rich-hanchan-draft:${roomCode}` : undefined}
    />
    </>}
    </div>
  );
}
