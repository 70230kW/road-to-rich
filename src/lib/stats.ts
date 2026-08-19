import type { DayRecord, Player } from '../types';

export interface DashboardStats {
  mostHanchansPlayed: { value: number; playerName: string } | null;
  bestAvgDailyWin: { value: number; playerName: string } | null;
  highestScore: { value: number; playerName: string } | null;
  bestDailyWin: { value: number; playerName: string } | null;
  bestAvgRank: { value: number; playerName: string } | null;
  bestDailyChips: { value: number; playerName: string } | null;
}

function playerName(players: Player[], id: string): string {
  return players.find((p) => p.id === id)?.name ?? '不明な雀士';
}

export function computeDashboardStats(history: DayRecord[], players: Player[]): DashboardStats {
  let highestScore = -Infinity;
  let highestScorePlayerId: string | null = null;
  let bestDailyWin = -Infinity;
  let bestDailyWinPlayerId: string | null = null;
  let bestDailyChips = -Infinity;
  let bestDailyChipsPlayerId: string | null = null;

  for (const day of history) {
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
      if (entry.chipCount > bestDailyChips) {
        bestDailyChips = entry.chipCount;
        bestDailyChipsPlayerId = pid;
      }
    }
  }

  const rankingRows = computeRanking(history, players);
  const bestAvgRankRow = rankingRows
    .filter((r) => r.avgRank !== null)
    .reduce<RankingRow | null>((best, r) => (best === null || r.avgRank! < best.avgRank! ? r : best), null);
  const mostHanchansRow = rankingRows.reduce<RankingRow | null>(
    (best, r) => (best === null || r.hanchanCount > best.hanchanCount ? r : best),
    null,
  );
  const bestAvgDailyWinRow = rankingRows
    .filter((r) => r.dayCount > 0)
    .reduce<{ row: RankingRow; avg: number } | null>((best, r) => {
      const avg = r.totalProfitWithoutFee / r.dayCount;
      return best === null || avg > best.avg ? { row: r, avg } : best;
    }, null);

  return {
    mostHanchansPlayed: mostHanchansRow ? { value: mostHanchansRow.hanchanCount, playerName: mostHanchansRow.name } : null,
    bestAvgDailyWin: bestAvgDailyWinRow
      ? { value: bestAvgDailyWinRow.avg, playerName: bestAvgDailyWinRow.row.name }
      : null,
    highestScore:
      highestScorePlayerId !== null
        ? { value: highestScore, playerName: playerName(players, highestScorePlayerId) }
        : null,
    bestDailyWin:
      bestDailyWinPlayerId !== null
        ? { value: bestDailyWin, playerName: playerName(players, bestDailyWinPlayerId) }
        : null,
    bestAvgRank: bestAvgRankRow ? { value: bestAvgRankRow.avgRank!, playerName: bestAvgRankRow.name } : null,
    bestDailyChips:
      bestDailyChipsPlayerId !== null
        ? { value: bestDailyChips, playerName: playerName(players, bestDailyChipsPlayerId) }
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
  /** 場代抜きの累計損益。ランキングの順位もこの値を基準にする。 */
  totalProfitWithoutFee: number;
  /** 場代込みの累計損益（参考値として小さく表示する）。 */
  totalProfitWithFee: number;
  hanchanCount: number;
  /** その雀士が精算に参加した日数。 */
  dayCount: number;
  avgRank: number | null;
  avgChips: number | null;
}

export function computeRanking(history: DayRecord[], players: Player[]): RankingRow[] {
  const rows = new Map<
    string,
    RankingRow & { rankSum: number; chipSum: number; dayCount: number }
  >();
  players.forEach((p) => {
    rows.set(p.id, {
      playerId: p.id,
      name: p.name,
      totalProfitWithoutFee: 0,
      totalProfitWithFee: 0,
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
      row.totalProfitWithoutFee += entry.totalWithoutFee;
      row.totalProfitWithFee += entry.totalWithFee;
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
      totalProfitWithoutFee: r.totalProfitWithoutFee,
      totalProfitWithFee: r.totalProfitWithFee,
      hanchanCount: r.hanchanCount,
      dayCount: r.dayCount,
      avgRank: r.hanchanCount > 0 ? r.rankSum / r.hanchanCount : null,
      avgChips: r.dayCount > 0 ? r.chipSum / r.dayCount : null,
    }))
    .sort((a, b) => b.totalProfitWithoutFee - a.totalProfitWithoutFee);
}

export interface RadarRow {
  playerId: string;
  name: string;
  /** チップ獲得枚数の累計 */
  chipTotal: number;
  /** 最高素点 */
  highestScore: number;
  /** 平均着順（小さいほど優秀。1.00〜4.00の固定スケールで描画する） */
  avgRank: number;
  /** 1日最高勝ち額 */
  bestDailyWin: number;
  /** 平均素点 */
  avgRawScore: number;
}

/** Per-player aggregates for the 5-axis dashboard radar chart. */
export function computeRadarStats(history: DayRecord[], players: Player[]): RadarRow[] {
  const perPlayer = new Map<
    string,
    { chipTotal: number; highestScore: number; rankSum: number; hanchanCount: number; bestDailyWin: number; rawScoreSum: number }
  >();
  players.forEach((p) =>
    perPlayer.set(p.id, {
      chipTotal: 0,
      highestScore: -Infinity,
      rankSum: 0,
      hanchanCount: 0,
      bestDailyWin: -Infinity,
      rawScoreSum: 0,
    }),
  );

  for (const day of history) {
    for (const [pid, entry] of Object.entries(day.settlement)) {
      const row = perPlayer.get(pid);
      if (!row) continue;
      row.chipTotal += entry.chipCount;
      if (entry.totalWithFee > row.bestDailyWin) row.bestDailyWin = entry.totalWithFee;
    }
    for (const game of day.games) {
      for (const score of game.scores) {
        const row = perPlayer.get(score.playerId);
        if (!row) continue;
        row.hanchanCount += 1;
        row.rankSum += score.rank;
        row.rawScoreSum += score.rawScore;
        if (score.rawScore > row.highestScore) row.highestScore = score.rawScore;
      }
    }
  }

  const rows: RadarRow[] = [];
  perPlayer.forEach((v, pid) => {
    if (v.hanchanCount === 0) return;
    const avgRank = v.rankSum / v.hanchanCount;
    rows.push({
      playerId: pid,
      name: playerName(players, pid),
      chipTotal: v.chipTotal,
      highestScore: v.highestScore,
      avgRank,
      bestDailyWin: v.bestDailyWin === -Infinity ? 0 : v.bestDailyWin,
      avgRawScore: v.rawScoreSum / v.hanchanCount,
    });
  });
  return rows;
}

/**
 * Per-player counts of how many times each finishing rank (1着, 2着, …) was
 * taken. `counts[i]` is the number of times rank `i + 1` was taken. All
 * players' arrays share the same length (the highest rank seen across all
 * history), so callers can render them on a common axis without extra padding.
 */
export function computeRankCounts(history: DayRecord[], players: Player[]): Record<string, number[]> {
  const result: Record<string, number[]> = {};
  players.forEach((p) => (result[p.id] = []));

  let maxRank = 0;
  for (const day of history) {
    for (const game of day.games) {
      for (const score of game.scores) {
        const arr = result[score.playerId];
        if (!arr) continue;
        while (arr.length < score.rank) arr.push(0);
        arr[score.rank - 1] += 1;
        if (score.rank > maxRank) maxRank = score.rank;
      }
    }
  }

  Object.values(result).forEach((arr) => {
    while (arr.length < maxRank) arr.push(0);
  });
  return result;
}

export interface YakumanAchievement {
  playerId: string;
  playerName: string;
  date: string;
}

/** Maps each achieved yakumanId to every occurrence (player + day) across all history. */
export function computeYakumanAchievements(history: DayRecord[], players: Player[]): Record<string, YakumanAchievement[]> {
  const result: Record<string, YakumanAchievement[]> = {};
  for (const day of history) {
    for (const game of day.games) {
      for (const event of game.yakumanEvents ?? []) {
        for (const yakumanId of event.yakumanIds) {
          if (!result[yakumanId]) result[yakumanId] = [];
          result[yakumanId].push({
            playerId: event.playerId,
            playerName: playerName(players, event.playerId),
            date: day.date,
          });
        }
      }
    }
  }
  return result;
}
