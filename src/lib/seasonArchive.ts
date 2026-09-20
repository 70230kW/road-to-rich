import type { DayRecord, LeagueSeason, Player } from '../types';
import { computeRanking } from './stats';

export function getSeasonDays(history: DayRecord[], season: LeagueSeason): DayRecord[] {
  const start = new Date(`${season.startDate}T00:00:00`).getTime();
  const end = season.endDate ? new Date(`${season.endDate}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
  return history.filter((day) => {
    if (day.seasonId) return day.seasonId === season.id;
    const time = new Date(day.date).getTime();
    return time >= start && time <= end;
  });
}

export function computeSeasonSnapshot(history: DayRecord[], players: Player[], season: LeagueSeason) {
  const days = getSeasonDays(history, season);
  const ranking = computeRanking(days, players);
  const hanchanCount = days.reduce((sum, day) => sum + day.games.length, 0);
  const topCounts = new Map<string, number>();
  days.forEach((day) => day.games.forEach((game) => game.scores.forEach((score) => {
    if (score.rank === 1) topCounts.set(score.playerId, (topCounts.get(score.playerId) ?? 0) + 1);
  })));
  const topHunter = [...topCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    days,
    ranking,
    hanchanCount,
    champion: ranking[0] ?? null,
    topHunter: topHunter ? { playerId: topHunter[0], count: topHunter[1], name: players.find((player) => player.id === topHunter[0])?.name ?? '不明' } : null,
  };
}
