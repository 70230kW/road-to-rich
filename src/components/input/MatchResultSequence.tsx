import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Crown, Medal, Sparkles, Target, Trophy } from 'lucide-react';
import type { DayRecord, Player, Settings } from '../../types';
import { computeRanking } from '../../lib/stats';
import { computePlayerRankStatuses } from '../../lib/rankLevel';
import { rankPositions } from '../../lib/rankingMovement';
import { computePlayerTrophies, TROPHY_LIST } from '../../lib/trophies';
import { formatSignedYen } from '../../lib/format';
import { ScrambleText } from '../common/ScrambleText';
import { RankBadge } from '../common/RankBadge';
import { ResultShareButton } from '../share/ResultShareButton';

const RESULT_STEPS = ['最終結果', 'リーグ変動', 'ハイライト'] as const;

export function MatchResultSequence({
  title,
  resultDay,
  historyBefore,
  players,
  settings,
  onComplete,
}: {
  title: string;
  resultDay: DayRecord;
  historyBefore: DayRecord[];
  players: Player[];
  settings: Settings;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const historyAfter = useMemo(() => [...historyBefore, resultDay], [historyBefore, resultDay]);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const finalRows = useMemo(() => Object.entries(resultDay.settlement).map(([id, entry]) => ({
    id,
    name: players.find((player) => player.id === id)?.name ?? '不明',
    color: players.find((player) => player.id === id)?.color,
    profit: entry.totalWithFee,
    profitWithoutFee: entry.totalWithoutFee,
  })).sort((a, b) => b.profit - a.profit), [players, resultDay.settlement]);

  const leagueChanges = useMemo(() => {
    const beforeRanking = computeRanking(historyBefore, players);
    const afterRanking = computeRanking(historyAfter, players);
    const beforePositions = rankPositions(beforeRanking);
    const afterPositions = rankPositions(afterRanking);
    const beforeStatuses = computePlayerRankStatuses(historyBefore, players);
    const afterStatuses = computePlayerRankStatuses(historyAfter, players);
    return finalRows.map((row) => ({
      ...row,
      beforePosition: beforePositions[row.id] ?? null,
      afterPosition: afterPositions[row.id] ?? null,
      beforeStatus: beforeStatuses[row.id],
      afterStatus: afterStatuses[row.id],
    }));
  }, [finalRows, historyAfter, historyBefore, players]);

  const highlights = useMemo(() => {
    const trophiesBefore = computePlayerTrophies(historyBefore, players, settings);
    const trophiesAfter = computePlayerTrophies(historyAfter, players, settings);
    const trophyById = new Map(TROPHY_LIST.map((trophy) => [trophy.id, trophy]));
    const newTrophies = finalRows.flatMap((row) => [...(trophiesAfter[row.id] ?? new Set<string>())]
      .filter((id) => !(trophiesBefore[row.id] ?? new Set<string>()).has(id))
      .map((id) => ({ playerId: row.id, playerName: row.name, trophy: trophyById.get(id) })))
      .filter((entry) => entry.trophy !== undefined);

    const previousHighs = new Map<string, number>();
    historyBefore.forEach((day) => day.games.forEach((game) => game.scores.forEach((score) => {
      previousHighs.set(score.playerId, Math.max(previousHighs.get(score.playerId) ?? -Infinity, score.rawScore));
    })));
    const dayHighs = new Map<string, number>();
    resultDay.games.forEach((game) => game.scores.forEach((score) => {
      dayHighs.set(score.playerId, Math.max(dayHighs.get(score.playerId) ?? -Infinity, score.rawScore));
    }));
    const records = [...dayHighs.entries()].filter(([id, score]) => score > (previousHighs.get(id) ?? -Infinity)).map(([id, score]) => ({
      id,
      name: players.find((player) => player.id === id)?.name ?? '不明',
      score,
    }));
    const bestScore = resultDay.games.flatMap((game) => game.scores).sort((a, b) => b.rawScore - a.rawScore)[0] ?? null;
    return { newTrophies, records, bestScore };
  }, [finalRows, historyAfter, historyBefore, players, resultDay.games, settings]);

  return (
    <section className="match-result" aria-label="対局終了リザルト">
      <div className="match-result-progress" role="tablist" aria-label="リザルトのページ" onKeyDown={event => {
        const next = event.key === 'ArrowRight' ? (step + 1) % RESULT_STEPS.length : event.key === 'ArrowLeft' ? (step + RESULT_STEPS.length - 1) % RESULT_STEPS.length : event.key === 'Home' ? 0 : event.key === 'End' ? RESULT_STEPS.length - 1 : null;
        if (next !== null) { event.preventDefault(); setStep(next); event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus(); }
      }}>
        {RESULT_STEPS.map((label, index) => <button id={`result-tab-${index}`} aria-controls="result-panel" tabIndex={step === index ? 0 : -1} key={label} type="button" role="tab" aria-selected={step === index} onClick={() => setStep(index)}><span>{index < step ? <Check size={12} /> : index + 1}</span>{label}</button>)}
      </div>

      <div key={step} id="result-panel" role="tabpanel" aria-labelledby={`result-tab-${step}`} className="match-result-stage">
        {step === 0 && <>
          <div className="match-result-title"><Crown aria-hidden="true" /><p className="eyebrow">MATCH COMPLETE</p><h2 ref={headingRef} tabIndex={-1}>{title}</h2><span>{resultDay.games.length}半荘の最終結果</span></div>
          <ol className="match-result-ranking">
            {finalRows.map((row, index) => <li key={row.id} className={index === 0 ? 'is-winner' : ''}><span>{index + 1}</span><i style={{ backgroundColor: row.color }} /><strong>{row.name}</strong><em className={row.profit >= 0 ? 'profit-positive' : 'profit-negative'}><ScrambleText text={formatSignedYen(row.profit)} />円</em></li>)}
          </ol>
        </>}

        {step === 1 && <>
          <div className="match-result-title"><Target aria-hidden="true" /><p className="eyebrow">LEAGUE IMPACT</p><h2 ref={headingRef} tabIndex={-1}>順位・段位の変化</h2><span>今回の精算をリーグ全体へ反映しました</span></div>
          <div className="match-result-changes">
            {leagueChanges.map((row) => {
              const positionDelta = row.beforePosition === null || row.afterPosition === null ? null : row.beforePosition - row.afterPosition;
              const rankChanged = row.beforeStatus.levelIndex !== row.afterStatus.levelIndex;
              return <div key={row.id}><div><strong>{row.name}</strong><span className={row.profitWithoutFee >= 0 ? 'profit-positive' : 'profit-negative'}>{formatSignedYen(row.profitWithoutFee)}</span></div><p>{row.beforePosition === null ? '初参加' : `${row.beforePosition}位`}<ArrowRight size={13} />{row.afterPosition}位 {positionDelta !== null && positionDelta !== 0 && <em className={positionDelta > 0 ? 'profit-positive' : 'profit-negative'}>{positionDelta > 0 ? `↑${positionDelta}` : `↓${Math.abs(positionDelta)}`}</em>}</p><div className="match-result-rank-change"><RankBadge status={row.afterStatus} />{rankChanged && <small>{row.beforeStatus.levelName} → {row.afterStatus.levelName}</small>}</div></div>;
            })}
          </div>
        </>}

        {step === 2 && <>
          <div className="match-result-title"><Sparkles aria-hidden="true" /><p className="eyebrow">NEW HIGHLIGHTS</p><h2 ref={headingRef} tabIndex={-1}>記録と実績</h2><span>今日生まれたハイライトをまとめました</span></div>
          <div className="match-result-highlights">
            {highlights.bestScore && <div><Medal aria-hidden="true" /><span>本日の最高素点</span><strong>{players.find((player) => player.id === highlights.bestScore?.playerId)?.name ?? '不明'}</strong><em>{highlights.bestScore.rawScore.toLocaleString()}点</em></div>}
            {highlights.records.map((record) => <div key={record.id}><Sparkles aria-hidden="true" /><span>自己最高素点を更新</span><strong>{record.name}</strong><em>{record.score.toLocaleString()}点</em></div>)}
            {highlights.newTrophies.slice(0, 4).map((entry) => <div key={`${entry.playerId}-${entry.trophy!.id}`}><Trophy aria-hidden="true" /><span>新しい実績を解除</span><strong>{entry.playerName}</strong><em>{entry.trophy!.name}</em></div>)}
            {highlights.records.length === 0 && highlights.newTrophies.length === 0 && <div className="match-result-no-unlock"><Target aria-hidden="true" /><strong>次の記録へ</strong><span>今回は新記録・新実績なし。次戦の更新を狙いましょう。</span></div>}
          </div>
          <ResultShareButton title={title} date={new Date(resultDay.date).toLocaleDateString('ja-JP')} rows={finalRows.map((row, index) => ({ id: row.id, name: row.name, profit: row.profit, color: row.color, rank: index + 1 }))} hanchanCount={resultDay.games.length} />
        </>}
      </div>

      <div className="match-result-controls">
        <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}><ArrowLeft size={17} />戻る</button>
        {step < RESULT_STEPS.length - 1 ? <button type="button" className="solid-action" onClick={() => setStep((current) => current + 1)}>次を見る<ArrowRight size={17} /></button> : <button type="button" className="solid-action" onClick={onComplete}>リーグホームへ<ArrowRight size={17} /></button>}
      </div>
    </section>
  );
}
