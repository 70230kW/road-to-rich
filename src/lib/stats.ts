import type { DayRecord, Player } from '../types';

export interface DashboardStats {
  totalDays: number;
  totalGames: number;
  highestScore: { value: number; playerName: string } | null;
  bestDailyWin: { value: number; playerName: string } | null;
}

function playerName(players: Player[], id: string): string {
  return players.find((p) => p.id === id)?.name ?? '不明な雀士';
}

export function computeDashboardStats(history: DayRecord[], players: Player[]): DashboardStats {
  let totalGames = 0;
  let highestScore = -Infinity;
  let highestScorePlayerId: string | null = null;
  let bestDailyWin = -Infinity;
  let bestDailyWinPlayerId: string | null = null;

  for (const day of history) {
    totalGames += day.games.length;
    for (const game of day.games) {
      for (const score of game.scores) {
        if (score.rawScore > highestScore) {
          highestScore = score.rawScore;
          highestScorePlayerId = score.playerId;
        }
      }
    }
    for (const [pid, entry] of Object.entries(day.settlement)) {
      if (entry.totalWithFee > bestDailyWin) {
        bestDailyWin = entry.totalWithFee;
        bestDailyWinPlayerId = pid;
      }
    }
  }

  return {
    totalDays: history.length,
    totalGames,
    highestScore:
      highestScorePlayerId !== null
        ? { value: highestScore, playerName: playerName(players, highestScorePlayerId) }
        : null,
    bestDailyWin:
      bestDailyWinPlayerId !== null
        ? { value: bestDailyWin, playerName: playerName(players, bestDailyWinPlayerId) }
        : null,
  };
}

export interface CumulativePoint {
  label: string;
  dayId: string | null;
  values: Record<string, number>;
}

export interface CumulativeSeries {
  points: CumulativePoint[];
  activePlayers: Player[];
}

/** Builds a cumulative-profit series (every active player starts at 0). */
export function computeCumulativeSeries(history: DayRecord[], players: Player[]): CumulativeSeries {
  const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const playedIds = new Set<string>();
  sorted.forEach((day) => Object.keys(day.settlement).forEach((id) => playedIds.add(id)));
  const activePlayers = players.filter((p) => playedIds.has(p.id));

  const running: Record<string, number> = {};
  activePlayers.forEach((p) => (running[p.id] = 0));

  const points: CumulativePoint[] = [{ label: 'START', dayId: null, values: { ...running } }];

  sorted.forEach((day, idx) => {
    Object.entries(day.settlement).forEach(([pid, entry]) => {
      if (running[pid] === undefined) return;
      running[pid] += entry.totalWithFee;
    });
    points.push({
      label: `#${idx + 1}`,
      dayId: day.id,
      values: { ...running },
    });
  });

  return { points, activePlayers };
}

export interface RankingRow {
  playerId: string;
  name: string;
  totalProfit: number;
  hanchanCount: number;
  avgRank: number | null;
  avgChips: number | null;
}

export function computeRanking(history: DayRecord[], players: Player[]): RankingRow[] {
  const rows = new Map<string, RankingRow & { rankSum: number; chipSum: number; dayCount: number }>();
  players.forEach((p) => {
    rows.set(p.id, {
      playerId: p.id,
      name: p.name,
      totalProfit: 0,
      hanchanCount: 0,
      avgRank: null,
      avgChips: null,
      rankSum: 0,
      chipSum: 0,
      dayCount: 0,
    });
  });

  for (const day of history) {
    for (const [pid, entry] of Object.entries(day.settlement)) {
      const row = rows.get(pid);
      if (!row) continue;
      row.totalProfit += entry.totalWithFee;
      row.chipSum += entry.chipCount;
      row.dayCount += 1;
    }
    for (const game of day.games) {
      for (const score of game.scores) {
        const row = rows.get(score.playerId);
        if (!row) continue;
        row.hanchanCount += 1;
        row.rankSum += score.rank;
      }
    }
  }

  return Array.from(rows.values())
    .filter((r) => r.dayCount > 0 || r.hanchanCount > 0)
    .map((r) => ({
      playerId: r.playerId,
      name: r.name,
      totalProfit: r.totalProfit,
      hanchanCount: r.hanchanCount,
      avgRank: r.hanchanCount > 0 ? r.rankSum / r.hanchanCount : null,
      avgChips: r.dayCount > 0 ? r.chipSum / r.dayCount : null,
    }))
    .sort((a, b) => b.totalProfit - a.totalProfit);
}
