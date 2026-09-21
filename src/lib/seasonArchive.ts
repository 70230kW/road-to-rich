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
  const records = new Map<string, { topCount: number; rentaiCount: number; lastCount: number; hanchanCount: number; rawScoreTotal: number }>();
  days.forEach((day) => day.games.forEach((game) => {
    const lastRank = Math.max(...game.scores.map((score) => score.rank));
    game.scores.forEach((score) => {
      const record = records.get(score.playerId) ?? { topCount: 0, rentaiCount: 0, lastCount: 0, hanchanCount: 0, rawScoreTotal: 0 };
      record.hanchanCount += 1;
      record.rawScoreTotal += score.rawScore;
      if (score.rank === 1) record.topCount += 1;
      if (score.rank <= 2) record.rentaiCount += 1;
      if (score.rank === lastRank) record.lastCount += 1;
      records.set(score.playerId, record);
    });
  }));
  const topRateLeader = [...records.entries()]
    .map(([playerId, record]) => ({ playerId, ...record, rate: record.topCount / record.hanchanCount }))
    .sort((a, b) => b.rate - a.rate || b.hanchanCount - a.hanchanCount || b.topCount - a.topCount || a.playerId.localeCompare(b.playerId))[0];
  const rentaiRateLeader = [...records.entries()]
    .map(([playerId, record]) => ({ playerId, ...record, rate: record.rentaiCount / record.hanchanCount }))
    .sort((a, b) => b.rate - a.rate || b.hanchanCount - a.hanchanCount || b.rentaiCount - a.rentaiCount || a.playerId.localeCompare(b.playerId))[0];
  const lastAvoidanceLeader = [...records.entries()]
    .map(([playerId, record]) => ({ playerId, ...record, rate: (record.hanchanCount - record.lastCount) / record.hanchanCount }))
    .sort((a, b) => b.rate - a.rate || b.hanchanCount - a.hanchanCount || a.lastCount - b.lastCount || a.playerId.localeCompare(b.playerId))[0];
  const averageRawScoreLeader = [...records.entries()]
    .map(([playerId, record]) => ({ playerId, ...record, average: record.rawScoreTotal / record.hanchanCount }))
    .sort((a, b) => b.average - a.average || b.hanchanCount - a.hanchanCount || b.rawScoreTotal - a.rawScoreTotal || a.playerId.localeCompare(b.playerId))[0];
  const withPlayerName = <T extends { playerId: string }>(leader: T | undefined) => leader
    ? { ...leader, name: players.find((player) => player.id === leader.playerId)?.name ?? '不明' }
    : null;
  return {
    days,
    ranking,
    hanchanCount,
    champion: ranking[0] ?? null,
    topRateLeader: withPlayerName(topRateLeader),
    rentaiRateLeader: withPlayerName(rentaiRateLeader),
    lastAvoidanceLeader: withPlayerName(lastAvoidanceLeader),
    averageRawScoreLeader: withPlayerName(averageRawScoreLeader),
  };
}
