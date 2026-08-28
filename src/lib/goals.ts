import type { DayRecord, Player, PlayerGoal } from '../types';
import { computeRanking, computePlayerRateStats } from './stats';
import { filterToMonth } from './monthlyHighlights';

export interface GoalProgress {
  goal: PlayerGoal;
  /** 今月の実績値。type が 'profit' なら円、'topRate' なら 0〜100 のパーセント値。 */
  currentValue: number;
  /** target に対する達成率（0〜1超）。target が 0 の場合は 1。 */
  progressRatio: number;
  achieved: boolean;
}

/** 今月（referenceDate 基準）の目標達成状況を算出する。history はシーズン絞り込み前の全履歴を渡すこと。 */
export function computeGoalProgress(
  history: DayRecord[],
  players: Player[],
  goals: Record<string, PlayerGoal>,
  referenceDate: Date = new Date(),
): Record<string, GoalProgress | null> {
  const monthHistory = filterToMonth(history, referenceDate);
  const ranking = computeRanking(monthHistory, players);
  const rateStats = computePlayerRateStats(monthHistory, players);

  const result: Record<string, GoalProgress | null> = {};
  players.forEach((p) => {
    const goal = goals[p.id];
    if (!goal) {
      result[p.id] = null;
      return;
    }

    const currentValue =
      goal.type === 'profit'
        ? (ranking.find((r) => r.playerId === p.id)?.totalProfitWithoutFee ?? 0)
        : (rateStats[p.id]?.topRate ?? 0) * 100;

    const progressRatio = goal.target === 0 ? 1 : Math.max(0, currentValue / goal.target);

    result[p.id] = {
      goal,
      currentValue,
      progressRatio,
      achieved: currentValue >= goal.target,
    };
  });
  return result;
}
