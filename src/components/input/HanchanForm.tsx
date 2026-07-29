import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Gamepad2, Plus, Target, UserPlus } from 'lucide-react';
import type { Game, Player, Settings } from '../../types';
import { calcGameSettlement, computeAutoLastScore, parseHundredsInput, validateHanchanInput } from '../../lib/calc';
import { ErrorBanner } from '../common/ErrorBanner';
import { NeonButton } from '../common/NeonButton';
import { CurrentProfitsBar } from './CurrentProfitsBar';
import { RecordedGamesList } from './RecordedGamesList';

export function HanchanForm({
  players,
  settings,
  currentDayGames,
  onAddGame,
  onRemoveGame,
  onStartSettling,
  onNavigateToPlayers,
}: {
  players: Player[];
  settings: Settings;
  currentDayGames: Game[];
  onAddGame: (game: Omit<Game, 'id'>) => void;
  onRemoveGame: (gameId: string) => void;
  onStartSettling: () => void;
  onNavigateToPlayers: () => void;
}) {
  const playerCount = settings.playerCount;
  const lastIndex = playerCount - 1;

  const [selectedIds, setSelectedIds] = useState<(string | null)[]>(Array(playerCount).fill(null));
  const [manualInputs, setManualInputs] = useState<string[]>(Array(lastIndex).fill(''));
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  useEffect(() => {
    setSelectedIds(Array(playerCount).fill(null));
    setManualInputs(Array(playerCount - 1).fill(''));
    setAttemptedSubmit(false);
  }, [playerCount]);

  const otherRaw = useMemo(() => manualInputs.map(parseHundredsInput), [manualInputs]);
  const autoRaw = useMemo(() => computeAutoLastScore(otherRaw, settings), [otherRaw, settings]);
  const rawScores = useMemo(() => [...otherRaw, autoRaw], [otherRaw, autoRaw]);

  const validation = useMemo(
    () => validateHanchanInput(selectedIds, rawScores, settings),
    [selectedIds, rawScores, settings],
  );

  const notEnoughPlayers = players.length < playerCount;

  const handleSelectChange = (index: number, value: string) => {
    const next = [...selectedIds];
    next[index] = value === '' ? null : value;
    setSelectedIds(next);
  };

  const handleScoreChange = (index: number, value: string) => {
    const next = [...manualInputs];
    next[index] = value;
    setManualInputs(next);
  };

  const handleRecord = () => {
    setAttemptedSubmit(true);
    if (!validation.isValid) return;

    const entries = selectedIds.map((id, i) => ({ playerId: id as string, rawScore: rawScores[i] as number }));
    const settled = calcGameSettlement(entries, settings);
    onAddGame({ scores: settled });

    setManualInputs(Array(lastIndex).fill(''));
    setAttemptedSubmit(false);
    // selectedIds intentionally preserved for the next hanchan
  };

  const showBanner = attemptedSubmit && !validation.isValid ? validation.message : validation.totalMismatch ? validation.message : null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end border-b border-slate-700/50 pb-5 relative">
        <h2 className="text-2xl md:text-3xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 to-cyan-400 flex items-center tracking-wider">
          <Gamepad2 className="w-7 h-7 md:w-8 md:h-8 mr-3 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          半荘成績入力
        </h2>
        <div className="text-cyan-400 font-mono font-black bg-cyan-950/40 px-3 md:px-4 py-1.5 rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)] tracking-widest text-xs md:text-sm">
          {playerCount}人麻雀
        </div>
        <div className="absolute -bottom-[1px] left-0 w-32 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent" />
      </div>

      {notEnoughPlayers ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-5 bg-panel-2/40 border border-slate-700/50 rounded-3xl">
          <UserPlus className="w-12 h-12 text-slate-600" />
          <div>
            <p className="font-black text-slate-300 tracking-wide">
              雀士が {playerCount} 人未満しか登録されていません
            </p>
            <p className="text-sm text-slate-500 mt-1">
              「雀士登録」タブで、対局形式（{playerCount}人麻雀）に必要な人数を登録してください。
            </p>
          </div>
          <NeonButton variant="primary" onClick={onNavigateToPlayers} className="px-4">
            <UserPlus className="w-5 h-5 mr-2" /> 雀士登録タブへ
          </NeonButton>
        </div>
      ) : (
        <>
          <ErrorBanner message={showBanner} />

          <CurrentProfitsBar games={currentDayGames} players={players} />

          <div className="space-y-4">
            {Array.from({ length: playerCount }).map((_, i) => {
              const isAuto = i === lastIndex;
              const selectInvalid =
                validation.duplicatePlayerIds.has(selectedIds[i] ?? '') ||
                (attemptedSubmit && validation.missingPlayerIndices.has(i));
              const scoreInvalid =
                (attemptedSubmit && validation.missingScoreIndices.has(i)) ||
                (validation.missingScoreIndices.size === 0 && validation.totalMismatch);
              const displayValue = isAuto
                ? autoRaw !== null
                  ? String(autoRaw / 100)
                  : ''
                : manualInputs[i];

              return (
                <div
                  key={i}
                  className={`flex flex-col md:flex-row md:items-center gap-4 p-4 md:p-5 rounded-2xl border transition-all duration-300 ${
                    isAuto
                      ? 'bg-cyan-950/20 border-cyan-800/50 shadow-[0_0_15px_rgba(6,182,212,0.05)]'
                      : 'bg-panel-2/60 border-slate-700/50 hover:border-slate-500/50'
                  }`}
                >
                  <div className="relative flex-1">
                    <select
                      value={selectedIds[i] ?? ''}
                      onChange={(e) => handleSelectChange(i, e.target.value)}
                      className={`w-full bg-abyss border rounded-xl px-4 py-3.5 text-slate-100 focus:outline-none focus:ring-1 font-bold appearance-none transition-all cursor-pointer tracking-wider shadow-inner ${
                        selectInvalid
                          ? 'border-rose-500/80 focus:border-rose-400 focus:ring-rose-400/50'
                          : 'border-slate-700/80 focus:border-cyan-400 focus:ring-cyan-400/50'
                      }`}
                    >
                      <option value="">雀士を選択</option>
                      {players.map((p) => {
                        const isSelectedElsewhere = selectedIds.includes(p.id) && selectedIds[i] !== p.id;
                        if (isSelectedElsewhere) return null;
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500/70 pointer-events-none" />
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-48">
                      <input
                        type="number"
                        value={displayValue}
                        onChange={(e) => handleScoreChange(i, e.target.value)}
                        disabled={isAuto}
                        placeholder="0"
                        aria-label={isAuto ? '自動計算される素点' : `素点 (百点単位)`}
                        className={`w-full bg-abyss border rounded-xl px-4 py-3.5 focus:outline-none font-mono text-xl md:text-2xl text-right transition-all shadow-inner ${
                          isAuto
                            ? 'border-cyan-800/80 text-cyan-300 bg-cyan-950/30'
                            : scoreInvalid
                              ? 'border-rose-500/80 text-slate-100 focus:border-rose-400 focus:ring-1 focus:ring-rose-400/50'
                              : 'border-slate-700/80 text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50'
                        }`}
                      />
                    </div>
                    <span
                      className={`font-mono font-black text-xl md:text-2xl w-9 md:w-12 ${
                        isAuto ? 'text-cyan-500/80 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]' : 'text-slate-500'
                      }`}
                    >
                      00
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <NeonButton variant="primary" onClick={handleRecord} className="w-full mt-6">
            <Plus className="w-6 h-6 mr-2" /> この半荘を記録する
          </NeonButton>

          {currentDayGames.length > 0 && (
            <RecordedGamesList games={currentDayGames} players={players} onRemove={onRemoveGame} />
          )}
        </>
      )}

      {currentDayGames.length > 0 && (
        <div className="pt-8 mt-8 border-t border-slate-700/50">
          <NeonButton variant="gradient" onClick={onStartSettling} className="w-full">
            <Target className="w-6 h-6 mr-3" /> 一日の対局を終えて精算する
          </NeonButton>
        </div>
      )}
    </div>
  );
}
