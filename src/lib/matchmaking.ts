import type { DayRecord, Player } from '../types';

export interface PairSuggestion {
  playerAId: string;
  playerBId: string;
  sharedHanchanCount: number;
  /** 最後に同卓した日付（ISO）。一度も同卓していなければ null。 */
  lastPlayedDate: string | null;
}

/**
 * 同卓回数が少ない（または一度も同卓していない）組み合わせほど上位に来るよう並べる。
 * 同数の場合は、最後に同卓した日が古い順（一度も無ければ最優先）。
 */
export function computeRarePairs(history: DayRecord[], players: Player[], limit = 3): PairSuggestion[] {
  const pairs: PairSuggestion[] = [];

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i].id;
      const b = players[j].id;
      let sharedHanchanCount = 0;
      let lastPlayedDate: string | null = null;

      for (const day of history) {
        for (const game of day.games) {
          const hasA = game.scores.some((s) => s.playerId === a);
          const hasB = game.scores.some((s) => s.playerId === b);
          if (!hasA || !hasB) continue;
          sharedHanchanCount += 1;
          if (lastPlayedDate === null || new Date(day.date).getTime() > new Date(lastPlayedDate).getTime()) {
            lastPlayedDate = day.date;
          }
        }
      }

      pairs.push({ playerAId: a, playerBId: b, sharedHanchanCount, lastPlayedDate });
    }
  }

  return pairs
    .sort((x, y) => {
      if (x.sharedHanchanCount !== y.sharedHanchanCount) return x.sharedHanchanCount - y.sharedHanchanCount;
      const xTime = x.lastPlayedDate ? new Date(x.lastPlayedDate).getTime() : -Infinity;
      const yTime = y.lastPlayedDate ? new Date(y.lastPlayedDate).getTime() : -Infinity;
      return xTime - yTime;
    })
    .slice(0, limit);
}
