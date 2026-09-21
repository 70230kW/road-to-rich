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
  const records = new Map<string, { topCount: number; lastCount: number; hanchanCount: number }>();
  days.forEach((day) => day.games.forEach((game) => {
    const lastRank = Math.max(...game.scores.map((score) => score.rank));
    game.scores.forEach((score) => {
      const record = records.get(score.playerId) ?? { topCount: 0, lastCount: 0, hanchanCount: 0 };
      record.hanchanCount += 1;
      if (score.rank === 1) record.topCount += 1;
      if (score.rank === lastRank) record.lastCount += 1;
      records.set(score.playerId, record);
    });
  }));
  const topRateLeader = [...records.entries()]
    .map(([playerId, record]) => ({ playerId, ...record, rate: record.topCount / record.hanchanCount }))
    .sort((a, b) => b.rate - a.rate || b.hanchanCount - a.hanchanCount || b.topCount - a.topCount || a.playerId.localeCompare(b.playerId))[0];
  const lastAvoidanceLeader = [...records.entries()]
    .map(([playerId, record]) => ({ playerId, ...record, rate: (record.hanchanCount - record.lastCount) / record.hanchanCount }))
    .sort((a, b) => b.rate - a.rate || b.hanchanCount - a.hanchanCount || a.lastCount - b.lastCount || a.playerId.localeCompare(b.playerId))[0];
  return {
    days,
    ranking,
    hanchanCount,
    champion: ranking[0] ?? null,
    topRateLeader: topRateLeader ? { ...topRateLeader, name: players.find((player) => player.id === topRateLeader.playerId)?.name ?? '不明' } : null,
    lastAvoidanceLeader: lastAvoidanceLeader ? { ...lastAvoidanceLeader, name: players.find((player) => player.id === lastAvoidanceLeader.playerId)?.name ?? '不明' } : null,
  };
}
