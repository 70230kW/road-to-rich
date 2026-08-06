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
      const avg = r.totalProfitWithFee / r.dayCount;
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
  /** 平均着順（実際の値。小さいほど優秀） */
  avgRank: number;
  /** 平均着順を「大きいほど優秀」になるよう反転した値（レーダーチャート描画用） */
  avgRankInverted: number;
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

  let maxRankSeen = 1;

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
        if (score.rank > maxRankSeen) maxRankSeen = score.rank;
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
      avgRankInverted: maxRankSeen + 1 - avgRank,
      bestDailyWin: v.bestDailyWin === -Infinity ? 0 : v.bestDailyWin,
      avgRawScore: v.rawScoreSum / v.hanchanCount,
    });
  });
  return rows;
}
