import type { DayRecord, GameScore, PlayerCount } from '../types';

export interface TrendGame extends GameScore {
  dayId: string; date: string; title: string; number: number;
}
export function playerTrendGames(history: DayRecord[], playerId: string, count: PlayerCount): TrendGame[] {
  return [...history].sort((a, b) => Date.parse(a.date) - Date.parse(b.date)).flatMap(day => day.games.flatMap((game, index) => {
    const score = game.scores.find(row => row.playerId === playerId);
    return score && game.scores.length === count
      ? [{ ...score, dayId: day.id, date: day.date, title: day.session?.title ?? '通常対局', number: index + 1 }] : [];
  }));
}

function summarize(games: TrendGame[], count: PlayerCount) {
  const n = games.length;
  return {
    count: n, first: games[0], last: games.at(-1),
    topRate: n ? games.filter(game => game.rank === 1).length / n : null,
    avoidLastRate: n ? games.filter(game => game.rank !== count).length / n : null,
    avgRank: n ? games.reduce((sum, game) => sum + game.rank, 0) / n : null,
    profit: n ? games.reduce((sum, game) => sum + game.point, 0) : null,
  };
}

/** Compare equal, non-overlapping windows of the same mahjong format. */
export function computeRecentTrends(history: DayRecord[], playerId: string, count: PlayerCount) {
  const games = playerTrendGames(history, playerId, count);
  const recentGames = games.slice(-20);
  const previousGames = games.slice(Math.max(0, games.length - 40), Math.max(0, games.length - 20));
  const recent = summarize(recentGames, count);
  const previous = summarize(previousGames, count);
  const contributions = new Map<string, { id: string; title: string; date: string; count: number; profit: number }>();
  recentGames.forEach(game => {
    const row = contributions.get(game.dayId) ?? { id: game.dayId, title: game.title, date: game.date, count: 0, profit: 0 };
    row.count++; row.profit += game.point; contributions.set(game.dayId, row);
  });
  return {
    recent, previous, total: games.length, ready: recent.count === 20 && previous.count === 20,
    missing: Math.max(0, 40 - games.length),
    contributions: [...contributions.values()].sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit)),
  };
}
