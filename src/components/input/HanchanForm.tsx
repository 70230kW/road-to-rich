import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Gamepad2, Plus, Target, UserPlus } from 'lucide-react';
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
  const [tieOrderOverrides, setTieOrderOverrides] = useState<Record<number, string[]>>({});

  useEffect(() => {
    setSelectedIds(Array(playerCount).fill(null));
    setManualInputs(Array(playerCount - 1).fill(''));
    setAttemptedSubmit(false);
    setTieOrderOverrides({});
  }, [playerCount]);

  const otherRaw = useMemo(() => manualInputs.map(parseHundredsInput), [manualInputs]);
  const autoRaw = useMemo(() => computeAutoLastScore(otherRaw, settings), [otherRaw, settings]);
  const rawScores = useMemo(() => [...otherRaw, autoRaw], [otherRaw, autoRaw]);

  const validation = useMemo(
    () => validateHanchanInput(selectedIds, rawScores, settings),
    [selectedIds, rawScores, settings],
  );

  // 素点が同じ雀士は本来「起家を基準」に着順が決まるが、入力欄の並び順が
  // 必ずしも起家順とは限らないため、同点が出たときだけ手動で並べ替えられるようにする。
  const tieGroups = useMemo(() => {
    const byScore = new Map<number, string[]>();
    selectedIds.forEach((id, i) => {
      const score = rawScores[i];
      if (id === null || score === null) return;
      if (!byScore.has(score)) byScore.set(score, []);
      byScore.get(score)!.push(id);
    });
    return Array.from(byScore.entries())
      .filter(([, ids]) => ids.length > 1)
      .map(([score, playerIds]) => ({ score, playerIds }));
  }, [selectedIds, rawScores]);

  const tieBreakOrder = useMemo(() => {
    if (tieGroups.length === 0) return undefined;
    return tieGroups.flatMap((g) => tieOrderOverrides[g.score] ?? g.playerIds);
  }, [tieGroups, tieOrderOverrides]);

  const movePlayer = (score: number, order: string[], from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setTieOrderOverrides((prev) => ({ ...prev, [score]: next }));
  };

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
    const settled = calcGameSettlement(entries, settings, tieBreakOrder);
    onAddGame({ scores: settled });

    setManualInputs(Array(lastIndex).fill(''));
    setAttemptedSubmit(false);
    setTieOrderOverrides({});
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
                  className={`flex items-center gap-2 sm:gap-4 p-2.5 sm:p-4 md:p-5 rounded-2xl border transition-all duration-300 ${
                    isAuto
                      ? 'bg-cyan-950/20 border-cyan-800/50 shadow-[0_0_15px_rgba(6,182,212,0.05)]'
                      : 'bg-panel-2/60 border-slate-700/50 hover:border-slate-500/50'
                  }`}
                >
                  <div className="relative flex-1 min-w-0">
                    <select
                      value={selectedIds[i] ?? ''}
                      onChange={(e) => handleSelectChange(i, e.target.value)}
                      className={`w-full bg-abyss border rounded-xl pl-2.5 sm:pl-4 pr-7 sm:pr-10 py-2.5 sm:py-3.5 text-slate-100 focus:outline-none focus:ring-1 font-bold appearance-none transition-all cursor-pointer tracking-wide sm:tracking-wider shadow-inner text-xs sm:text-base ${
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
                    <ChevronDown className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-cyan-500/70 pointer-events-none" />
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                    <div className="relative w-20 sm:w-32 md:w-48">
                      <input
                        type="number"
                        value={displayValue}
                        onChange={(e) => handleScoreChange(i, e.target.value)}
                        disabled={isAuto}
                        placeholder="0"
                        aria-label={isAuto ? '自動計算される素点' : `素点 (百点単位)`}
                        className={`w-full bg-abyss border rounded-xl px-2 sm:px-4 py-2.5 sm:py-3.5 focus:outline-none font-mono text-base sm:text-xl md:text-2xl text-right transition-all shadow-inner ${
                          isAuto
                            ? 'border-cyan-800/80 text-cyan-300 bg-cyan-950/30'
                            : scoreInvalid
                              ? 'border-rose-500/80 text-slate-100 focus:border-rose-400 focus:ring-1 focus:ring-rose-400/50'
                              : 'border-slate-700/80 text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50'
                        }`}
                      />
                    </div>
                    <span
                      className={`font-mono font-black text-base sm:text-xl md:text-2xl w-6 sm:w-9 md:w-12 ${
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

          {tieGroups.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 space-y-5">
              <p className="text-xs font-black text-amber-400 tracking-wide flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                素点が同じ雀士がいます。起家を基準に、上が上位になるよう並べ替えてください。
              </p>
              {tieGroups.map((group) => {
                const order = tieOrderOverrides[group.score] ?? group.playerIds;
                return (
                  <div key={group.score} className="space-y-2">
                    <div className="text-[11px] text-slate-400 font-mono">
                      素点 {(group.score / 100).toLocaleString()}00点 が同点
                    </div>
                    {order.map((id, i) => (
                      <div
                        key={id}
                        className="flex items-center justify-between bg-abyss/80 border border-slate-700/60 rounded-xl px-4 py-2.5"
                      >
                        <span className="font-bold text-slate-200 text-sm">
                          {i + 1}位 {players.find((p) => p.id === id)?.name ?? '不明'}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={i === 0}
                            onClick={() => movePlayer(group.score, order, i, i - 1)}
                            aria-label="上位に移動"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={i === order.length - 1}
                            onClick={() => movePlayer(group.score, order, i, i + 1)}
                            aria-label="下位に移動"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

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
