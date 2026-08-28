import type { CustomTrophyConditionType, CustomTrophyDef, DayRecord, Player } from '../types';

export const CUSTOM_TROPHY_CONDITION_LABELS: Record<CustomTrophyConditionType, string> = {
  profitAtLeast: '累計収支が◯円以上',
  topRateAtLeast: 'トップ率が◯%以上',
  hanchanCountAtLeast: '通算半荘数が◯半荘以上',
  winStreakAtLeast: '◯連続トップ',
  tobiCountAtLeast: 'トビ回数が◯回以上',
};

/** トップ率条件を判定する際の最低半荘数。少ない対局数での偶然を避ける。 */
const MIN_HANCHAN_FOR_TOP_RATE = 10;

function isAchieved(history: DayRecord[], playerId: string, conditionType: CustomTrophyConditionType, threshold: number): boolean {
  const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let profit = 0;
  let hanchanCount = 0;
  let topCount = 0;
  let tobiCount = 0;
  let winStreak = 0;

  for (const day of sorted) {
    for (const game of day.games) {
      const score = game.scores.find((s) => s.playerId === playerId);
      if (!score) continue;

      hanchanCount += 1;
      if (score.rank === 1) {
        topCount += 1;
        winStreak += 1;
      } else {
        winStreak = 0;
      }
      if (score.rawScore < 0) tobiCount += 1;

      if (conditionType === 'hanchanCountAtLeast' && hanchanCount >= threshold) return true;
      if (conditionType === 'winStreakAtLeast' && winStreak >= threshold) return true;
      if (conditionType === 'tobiCountAtLeast' && tobiCount >= threshold) return true;
      if (conditionType === 'topRateAtLeast' && hanchanCount >= MIN_HANCHAN_FOR_TOP_RATE && (topCount / hanchanCount) * 100 >= threshold) {
        return true;
      }
    }

    const entry = day.settlement[playerId];
    if (entry) profit += entry.totalWithoutFee;
    if (conditionType === 'profitAtLeast' && profit >= threshold) return true;
  }

  return false;
}

/** グループ独自のトロフィーについて、各雀士が達成済みかどうかを判定する。 */
export function computeCustomTrophyAchievements(
  history: DayRecord[],
  players: Player[],
  customTrophies: CustomTrophyDef[],
): Record<string, Set<string>> {
  const result: Record<string, Set<string>> = {};
  players.forEach((p) => (result[p.id] = new Set()));

  for (const trophy of customTrophies) {
    for (const p of players) {
      if (isAchieved(history, p.id, trophy.conditionType, trophy.threshold)) {
        result[p.id].add(trophy.id);
      }
    }
  }
  return result;
}
