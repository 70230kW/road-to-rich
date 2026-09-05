import type { DayRecord } from '../types';

export interface GroupHeadToHeadPlayerStat {
  playerId: string;
  /** 同卓した対局のうち、選んだグループ内で最も良い順位だった回数。 */
  wins: number;
  /** 同卓した対局に限った、このプレイヤーの精算ポイント合計。 */
  totalPoints: number;
}

export interface GroupHeadToHeadStats {
  /** 選んだ全員が同卓した半荘数。 */
  sharedHanchanCount: number;
  /** playerIds と同じ順序の、各プレイヤーの成績。 */
  players: GroupHeadToHeadPlayerStat[];
}

/** playerIds 全員（2〜4人）が同卓した対局だけを基準にした、グループ内直接対決成績。 */
export function computeGroupHeadToHead(history: DayRecord[], playerIds: string[]): GroupHeadToHeadStats {
  const stats = new Map<string, GroupHeadToHeadPlayerStat>();
  playerIds.forEach((id) => stats.set(id, { playerId: id, wins: 0, totalPoints: 0 }));

  let sharedHanchanCount = 0;

  for (const day of history) {
    for (const game of day.games) {
      const scoreByPlayer = new Map(game.scores.map((s) => [s.playerId, s]));
      if (!playerIds.every((id) => scoreByPlayer.has(id))) continue;

      sharedHanchanCount += 1;
      const groupScores = playerIds.map((id) => scoreByPlayer.get(id)!);
      const bestRank = Math.min(...groupScores.map((s) => s.rank));

      for (const score of groupScores) {
        const stat = stats.get(score.playerId)!;
        stat.totalPoints += score.point;
        if (score.rank === bestRank) stat.wins += 1;
      }
    }
  }

  return { sharedHanchanCount, players: playerIds.map((id) => stats.get(id)!) };
}
