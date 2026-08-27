import type { DayRecord } from '../types';

export interface HeadToHeadStats {
  /** 2人が同じ対局（半荘）に同卓した回数。 */
  sharedHanchanCount: number;
  /** playerA が playerB より良い順位で終えた対局数。 */
  aWins: number;
  /** playerB が playerA より良い順位で終えた対局数。 */
  bWins: number;
  /** playerA の精算ポイント合計 - playerB の精算ポイント合計（同卓した対局のみ）。プラスなら A が優勢。 */
  totalPointDiff: number;
}

/** playerAId と playerBId が同卓した対局だけを基準にした直接対決成績。 */
export function computeHeadToHead(history: DayRecord[], playerAId: string, playerBId: string): HeadToHeadStats {
  let sharedHanchanCount = 0;
  let aWins = 0;
  let bWins = 0;
  let totalPointDiff = 0;

  for (const day of history) {
    for (const game of day.games) {
      const aScore = game.scores.find((s) => s.playerId === playerAId);
      const bScore = game.scores.find((s) => s.playerId === playerBId);
      if (!aScore || !bScore) continue;
      sharedHanchanCount += 1;
      if (aScore.rank < bScore.rank) aWins += 1;
      else if (bScore.rank < aScore.rank) bWins += 1;
      totalPointDiff += aScore.point - bScore.point;
    }
  }

  return { sharedHanchanCount, aWins, bWins, totalPointDiff };
}
