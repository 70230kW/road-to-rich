import { SaveReceipt } from './SaveReceipt';
import { SectionHeader } from '../common/SectionHeader';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Gamepad2, Plus, RotateCcw, Scale, Target, UserPlus } from 'lucide-react';
import type { Game, GameScore, Player, PlayerCount, Settings, YakumanEvent } from '../../types';
import {
  calcGameSettlement,
  computeAutoLastScore,
  getRankPoints,
  halveRankPoints,
  parseHundredsInput,
  validateHanchanInput,
} from '../../lib/calc';
import { ErrorBanner } from '../common/ErrorBanner';
import { NeonButton } from '../common/NeonButton';
import { CurrentProfitsBar } from './CurrentProfitsBar';
import { RecordedGamesList } from './RecordedGamesList';
import { YakumanInput } from './YakumanInput';
import { haptic } from '../../lib/haptics';

interface HanchanDraft {
  playerCount: number;
  selectedIds: (string | null)[];
  manualInputs: string[];
}

function readDraft(key: string | undefined, playerCount: number): HanchanDraft | null {
  if (!key) return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? 'null') as HanchanDraft | null;
    return parsed?.playerCount === playerCount ? parsed : null;
  } catch { return null; }
}

export function HanchanForm({
  players,
  settings,
  currentDayGames,
  onAddGame,
  onRemoveGame,
  onUpdateGameYakuman,
  onStartSettling,
  onNavigateToPlayers,
  onSetPlayerCount,
  receiptTitle = '半荘を保存しました',
  eligiblePlayerIds,
  draftKey,
}: {
  players: Player[];
  settings: Settings;
  currentDayGames: Game[];
  onAddGame: (game: Omit<Game, 'id'>) => void | string | Promise<void | string | undefined>;
  receiptTitle?: string;
  onRemoveGame: (gameId: string) => void | Promise<void>;
  onUpdateGameYakuman: (gameId: string, events: YakumanEvent[]) => void;
  onStartSettling: () => void;
  onNavigateToPlayers: () => void;
  onSetPlayerCount: (count: PlayerCount) => void;
  eligiblePlayerIds?: string[];
  draftKey?: string;
}) {
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const scoreRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedScores, setSavedScores] = useState<GameScore[] | null>(null);
  const [focusedSeat, setFocusedSeat] = useState(0);
  const playerCount = settings.playerCount;
  const lastIndex = playerCount - 1;
  const [initialDraft] = useState(() => readDraft(draftKey, playerCount));

  const [selectedIds, setSelectedIds] = useState<(string | null)[]>(initialDraft?.selectedIds ?? Array(playerCount).fill(null));
  const [manualInputs, setManualInputs] = useState<string[]>(initialDraft?.manualInputs ?? Array(lastIndex).fill(''));
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [tieOrderOverrides, setTieOrderOverrides] = useState<Record<number, string[]>>({});
  const [yakumanEvents, setYakumanEvents] = useState<YakumanEvent[]>([]);
  const [isRankPointsOpen, setIsRankPointsOpen] = useState(false);
  // null = 通常の設定通り。値を編集した半荘だけ、この配列を使う。
  const [rankPointsOverride, setRankPointsOverride] = useState<number[] | null>(null);
  const [savedGameId, setSavedGameId] = useState<string | null>(null);
  const previousPlayerCount = useRef(playerCount);

  useEffect(() => {
    if (previousPlayerCount.current === playerCount) return;
    previousPlayerCount.current = playerCount;
    setSelectedIds(Array(playerCount).fill(null));
    setManualInputs(Array(playerCount - 1).fill(''));
    setAttemptedSubmit(false);
    setTieOrderOverrides({});
    setYakumanEvents([]);
    setIsRankPointsOpen(false);
    setRankPointsOverride(null);
  }, [playerCount]);

  useEffect(() => {
    if (!draftKey) return;
    try { localStorage.setItem(draftKey, JSON.stringify({ playerCount, selectedIds, manualInputs } satisfies HanchanDraft)); } catch { /* in-memory input remains available */ }
  }, [draftKey, manualInputs, playerCount, selectedIds]);

  useEffect(() => {
    if (!eligiblePlayerIds) return;
    setSelectedIds((current) => current.map((id) => id && eligiblePlayerIds.includes(id) ? id : null));
  }, [eligiblePlayerIds]);

  const defaultRankPoints = useMemo(() => getRankPoints(settings), [settings]);
  const activeRankPoints = rankPointsOverride ?? defaultRankPoints;
  const isRankPointsChanged = activeRankPoints.some((v, i) => v !== defaultRankPoints[i]);

  const handleRankPointChange = (index: number, value: string) => {
    const n = Number(value);
    const base = rankPointsOverride ?? [...defaultRankPoints];
    const next = [...base];
    next[index] = Number.isFinite(n) ? n : 0;
    setRankPointsOverride(next);
  };

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

  const notEnoughPlayers = (eligiblePlayerIds ? players.filter((player) => eligiblePlayerIds.includes(player.id)).length : players.length) < playerCount;

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

  const handleRecord = async () => {
    if (savingRef.current) return;
    setAttemptedSubmit(true);
    if (!validation.isValid) {
      const first = Array.from(validation.missingScoreIndices).find(i => i < lastIndex);
      if (first !== undefined) scoreRefs.current[first]?.focus();
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const entries = selectedIds.map((id, i) => ({ playerId: id as string, rawScore: rawScores[i] as number }));
      const settled = calcGameSettlement(entries, settings, tieBreakOrder, isRankPointsChanged ? activeRankPoints : undefined);
      const id = await onAddGame({
        scores: settled,
        ...(yakumanEvents.length > 0 ? { yakumanEvents } : {}),
        ...(isRankPointsChanged ? { rankPointsUsed: [...activeRankPoints] } : {}),
      });

      setManualInputs(Array(lastIndex).fill(''));
      setAttemptedSubmit(false);
      setTieOrderOverrides({});
      setYakumanEvents([]);
      setIsRankPointsOpen(false);
      setRankPointsOverride(null);
      setSavedScores(settled);
      setSavedGameId(typeof id === 'string' ? id : null);
      haptic('success');
      // selectedIds intentionally preserved for the next hanchan.
    } catch {
      setSaveError('保存できませんでした。入力内容は残っています。接続を確認して再試行してください。');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const participantIds = useMemo(() => selectedIds.filter((id): id is string => id !== null), [selectedIds]);
  const eligiblePlayers = useMemo(() => eligiblePlayerIds
    ? players.filter((player) => eligiblePlayerIds.includes(player.id))
    : players, [eligiblePlayerIds, players]);

  const showBanner = attemptedSubmit && !validation.isValid ? validation.message : validation.totalMismatch ? validation.message : null;

  const enteredTotal = otherRaw.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const expectedTotal = settings.initialScore * playerCount;
  const inputStep = validation.missingPlayerIndices.size > 0 ? 0 : validation.missingScoreIndices.size > 0 ? 1 : validation.isValid ? 3 : 2;
  const nextGame = () => {
    setSavedScores(null);
    requestAnimationFrame(() => scoreRefs.current[0]?.focus());
  };
  if (savedScores) return <SaveReceipt title={receiptTitle} detail="この半荘の結果 · チップ・場代を除く" rows={savedScores.map(score => ({ id: score.playerId, name: players.find(p => p.id === score.playerId)?.name ?? '不明', rank: score.rank, profit: score.point }))} onNext={nextGame} onSettle={onStartSettling} onUndo={savedGameId ? async () => { await onRemoveGame(savedGameId); haptic('warning'); setSavedScores(null); setSavedGameId(null); } : undefined} />;

  return (
    <fieldset disabled={saving} className="space-y-8 animate-fade-in min-w-0 border-0 p-0">
      <SectionHeader icon={Gamepad2} title="半荘成績入力" trailing={
        <button
          type="button"
          onClick={() => onSetPlayerCount(playerCount === 4 ? 3 : 4)}
          disabled={currentDayGames.length > 0}
          title={
            currentDayGames.length > 0
              ? '本日、未精算の半荘記録があるため対局形式は変更できません。先に精算を保存するか、記録を削除してください。'
              : 'タップで4人麻雀⇔3人麻雀を切り替え'
          }
          className="text-cyan-400 font-mono font-black bg-cyan-950/40 px-3 md:px-4 py-1.5 rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgb(var(--accent-rgb-500)/0.2)] tracking-widest text-xs md:text-sm transition-colors hover:bg-cyan-950/70 hover:border-cyan-400/60 disabled:opacity-50 disabled:pointer-events-none disabled:hover:bg-cyan-950/40"
        >
          {playerCount}人麻雀
        </button>
      } />

      <ol className="input-progress" aria-label="対局入力の進行状況">
        {['雀士選択', '点数入力', 'チップ・役満', '確認'].map((label, index) => <li key={label} className={index < inputStep ? 'is-complete' : index === inputStep ? 'is-current' : ''} aria-current={index === inputStep ? 'step' : undefined}><span>{index + 1}</span><small>{label}</small></li>)}
      </ol>

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
          <ErrorBanner message={saveError ?? showBanner} />

          <CurrentProfitsBar games={currentDayGames} players={players} />

          <p className="muted text-xs">素点は100点単位で入力（250 → 25,000点）。最後の1人は自動計算します。席番号は入力順で、起家順ではありません。</p>
          <div className={`score-table score-table-${playerCount}`}>
            <div className="score-table-center" aria-hidden="true"><span>第{currentDayGames.length + 1}半荘</span><strong>{playerCount}人麻雀</strong><small>{expectedTotal.toLocaleString()}点</small></div>
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
                  onFocusCapture={() => setFocusedSeat(i)}
                  className={`score-seat seat-${i} ${focusedSeat === i ? 'seat-focused' : ''} ${
                    isAuto
                      ? 'bg-cyan-950/20 border-cyan-800/50 shadow-[0_0_15px_rgb(var(--accent-rgb-500)/0.05)]'
                      : 'bg-panel-2/60 border-slate-700/50 hover:border-slate-500/50'
                  }`}
                >
                  <div className="score-seat-label"><span>席 {i + 1}</span><span>{isAuto ? '自動計算' : focusedSeat === i ? '入力中' : '素点入力'}</span></div>
                  <div className="relative flex-1 min-w-0">
                    <select
                      aria-label={`席${i + 1}の雀士`}
                      aria-invalid={selectInvalid}
                      aria-describedby={selectInvalid ? `seat-${i}-player-error` : undefined}
                      value={selectedIds[i] ?? ''}
                      onChange={(e) => handleSelectChange(i, e.target.value)}
                      className={`w-full bg-abyss border rounded-xl pl-2.5 sm:pl-4 pr-7 sm:pr-10 py-2.5 sm:py-3.5 text-slate-100 focus:outline-none focus:ring-1 font-bold appearance-none transition-all cursor-pointer tracking-wide sm:tracking-wider shadow-inner text-xs sm:text-base ${
                        selectInvalid
                          ? 'border-rose-500/80 focus:border-rose-400 focus:ring-rose-400/50'
                          : 'border-slate-700/80 focus:border-cyan-400 focus:ring-cyan-400/50'
                      }`}
                    >
                      <option value="">雀士を選択</option>
                      {eligiblePlayers.map((p) => {
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

                  {selectInvalid && <p id={`seat-${i}-player-error`} className="field-error">{validation.duplicatePlayerIds.has(selectedIds[i] ?? '') ? '同じ雀士は選べません' : '雀士を選択してください'}</p>}
                  <div className="score-value-row">
                    <div className="relative min-w-0 flex-1">
                      <input
                        ref={node => { scoreRefs.current[i] = node; }}
                        type="number"
                        inputMode="decimal"
                        step="any"
                        aria-invalid={scoreInvalid}
                        aria-describedby={`seat-${i}-score-help`}
                        value={displayValue}
                        onChange={(e) => handleScoreChange(i, e.target.value)}
                        disabled={isAuto}
                        placeholder="0"
                        aria-label={isAuto ? '自動計算される素点' : `席${i + 1}の素点 (百点単位)`}
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
                        isAuto ? 'text-cyan-500/80 drop-shadow-[0_0_5px_rgb(var(--accent-rgb-500)/0.5)]' : 'text-slate-500'
                      }`}
                    >
                      00
                    </span>
                  </div>
                  <div className="score-hint-row"><p id={`seat-${i}-score-help`} className={scoreInvalid ? 'field-error' : 'score-hint'}>{scoreInvalid ? '素点を入力してください' : rawScores[i] === null ? '入力待ち' : `${rawScores[i]!.toLocaleString()}点`}</p>
                    {!isAuto && <button type="button" className="negative-score" aria-label={`席${i + 1}の素点の符号を切り替える`} onClick={() => handleScoreChange(i, manualInputs[i].startsWith('-') ? manualInputs[i].slice(1) : `-${manualInputs[i]}`)}>± 切替</button>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-panel-2/40 border border-slate-700/50 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setIsRankPointsOpen((v) => !v)}
              aria-expanded={isRankPointsOpen}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
            >
              <span className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-300 tracking-wide">
                <Scale className="w-4 h-4 text-cyan-500 shrink-0" />
                順位点を編集
                {isRankPointsChanged && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                    変更中
                  </span>
                )}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${isRankPointsOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isRankPointsOpen && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  終電などで東場のみで打ち切った半荘など、この半荘だけ順位点を変えたいときに編集してください。次の半荘には引き継がれません。
                </p>
                <div className={`grid grid-cols-2 gap-2.5 ${playerCount === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
                  {activeRankPoints.map((v, i) => (
                    <div key={i} className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wide">{i + 1}着</label>
                      <input
                        type="number"
                        value={v}
                        onChange={(e) => handleRankPointChange(i, e.target.value)}
                        className="w-full bg-abyss border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm text-right focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 shadow-inner"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRankPointsOverride(halveRankPoints(defaultRankPoints))}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-950/70 transition-colors"
                  >
                    <Scale className="w-3.5 h-3.5" /> 順位点を半分にする
                  </button>
                  <button
                    type="button"
                    disabled={!isRankPointsChanged}
                    onClick={() => setRankPointsOverride(null)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-slate-400 border border-slate-700/60 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> デフォルトに戻す
                  </button>
                </div>
              </div>
            )}
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

          {participantIds.length > 0 && (
            <YakumanInput
              players={players}
              participantIds={participantIds}
              events={yakumanEvents}
              onChange={setYakumanEvents}
            />
          )}

          <div className="score-save-bar">
            <div className="score-save-totals" aria-live="polite"><span>{autoRaw === null ? '入力済み' : '合計'} <strong>{(validation.scoreTotal ?? enteredTotal).toLocaleString()}</strong> / {expectedTotal.toLocaleString()}点</span><small>{autoRaw === null ? `未入力 ${otherRaw.filter(v => v === null).length}人 · 最後の1人は自動計算` : `最後の1人 ${autoRaw.toLocaleString()}点 · ${validation.totalMismatch ? '合計を確認' : '合計一致'}`}</small></div>
            <button type="button" className="solid-action" onClick={handleRecord} disabled={saving}><Plus size={18}/>{saving ? '保存中…' : 'この半荘を記録する'}</button>
          </div>

          {currentDayGames.length > 0 && (
            <RecordedGamesList
              games={currentDayGames}
              players={players}
              onRemove={onRemoveGame}
              onUpdateYakuman={onUpdateGameYakuman}
            />
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
    </fieldset>
  );
}
