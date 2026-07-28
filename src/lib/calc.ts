import type { DaySettlementEntry, Game, GameScore, PlayerCount, Settings } from '../types';

/** Returns the rank-point array (uma+oka combined) active for the current format. */
export function getRankPoints(settings: Settings): readonly number[] {
  return settings.playerCount === 4 ? settings.rankPoints4 : settings.rankPoints3;
}

/** Total raw-score points that must be distributed across all seats (配給原点 × 人数). */
export function getExpectedScoreTotal(settings: Settings): number {
  return settings.initialScore * settings.playerCount;
}

/**
 * Auto-computes the bottom seat's raw score from the other (playerCount - 1) seats,
 * so the table always sums to `配給原点 × 人数`. Returns null until every other seat
 * has a value.
 */
export function computeAutoLastScore(
  otherRawScores: (number | null)[],
  settings: Settings,
): number | null {
  if (otherRawScores.length !== settings.playerCount - 1) return null;
  if (otherRawScores.some((s) => s === null || Number.isNaN(s))) return null;
  const sum = otherRawScores.reduce<number>((acc, s) => acc + (s as number), 0);
  return getExpectedScoreTotal(settings) - sum;
}

export interface HanchanValidation {
  isValid: boolean;
  missingPlayerIndices: Set<number>;
  duplicatePlayerIds: Set<string>;
  missingScoreIndices: Set<number>;
  totalMismatch: boolean;
  scoreTotal: number | null;
  expectedTotal: number;
  message: string | null;
}

/** Validates one hanchan's entry form. Surfaces exactly which fields are at fault. */
export function validateHanchanInput(
  playerIds: (string | null)[],
  rawScores: (number | null)[],
  settings: Settings,
): HanchanValidation {
  const missingPlayerIndices = new Set<number>();
  playerIds.forEach((id, i) => {
    if (!id) missingPlayerIndices.add(i);
  });

  const seenCounts = new Map<string, number>();
  playerIds.forEach((id) => {
    if (!id) return;
    seenCounts.set(id, (seenCounts.get(id) ?? 0) + 1);
  });
  const duplicatePlayerIds = new Set<string>();
  seenCounts.forEach((count, id) => {
    if (count > 1) duplicatePlayerIds.add(id);
  });

  const missingScoreIndices = new Set<number>();
  rawScores.forEach((s, i) => {
    if (s === null || Number.isNaN(s)) missingScoreIndices.add(i);
  });

  const expectedTotal = getExpectedScoreTotal(settings);
  let scoreTotal: number | null = null;
  let totalMismatch = false;
  if (missingScoreIndices.size === 0) {
    scoreTotal = rawScores.reduce<number>((acc, s) => acc + (s as number), 0);
    totalMismatch = scoreTotal !== expectedTotal;
  }

  const messages: string[] = [];
  if (missingPlayerIndices.size > 0) messages.push('全員の雀士を選択してください。');
  if (duplicatePlayerIds.size > 0) messages.push('雀士が重複しています。同じ雀士は1半荘に1人までです。');
  if (missingScoreIndices.size > 0) messages.push('全員の素点を入力してください。');
  if (totalMismatch) {
    messages.push(`素点の合計が一致しません。合計は ${expectedTotal.toLocaleString()} 点になる必要があります。`);
  }

  return {
    isValid:
      missingPlayerIndices.size === 0 &&
      duplicatePlayerIds.size === 0 &&
      missingScoreIndices.size === 0 &&
      !totalMismatch,
    missingPlayerIndices,
    duplicatePlayerIds,
    missingScoreIndices,
    totalMismatch,
    scoreTotal,
    expectedTotal,
    message: messages[0] ?? null,
  };
}

/**
 * Converts one hanchan's raw scores into ranked, settled results.
 * 精算金額 = (自身の素点 + 順位点 − 配給原点) ÷ 割る数
 * Ties keep the entrants' original relative order (stable sort).
 */
export function calcGameSettlement(
  entries: { playerId: string; rawScore: number }[],
  settings: Settings,
): GameScore[] {
  const rankPoints = getRankPoints(settings);
  const sorted = [...entries].sort((a, b) => b.rawScore - a.rawScore);
  return sorted.map((entry, idx) => ({
    playerId: entry.playerId,
    rawScore: entry.rawScore,
    rank: idx + 1,
    point: (entry.rawScore + rankPoints[idx] - settings.initialScore) / settings.divider,
  }));
}

/** 場代の均等割（端数切り上げ）。 */
export function calcTableFeeShare(totalFee: number, participantCount: number): number {
  if (participantCount <= 0 || !Number.isFinite(totalFee)) return 0;
  return Math.ceil(totalFee / participantCount);
}

/** チップの±合計が0であることを検証する。 */
export function isChipTotalBalanced(chips: Record<string, number | null | undefined>): boolean {
  const total = Object.values(chips).reduce<number>((acc, c) => acc + (Number(c) || 0), 0);
  return total === 0;
}

/**
 * Aggregates a day's recorded hanchans + chips + table fee into a per-player settlement.
 * 最終結果 = ゲーム精算合計 + チップ枚数×単価 − 場代合計÷参加人数
 */
export function calcDaySettlement(
  games: Game[],
  chips: Record<string, number>,
  tableFee: number,
  settings: Settings,
): Record<string, DaySettlementEntry> {
  const participantIds = Object.keys(chips);
  const tableFeeShare = calcTableFeeShare(tableFee, participantIds.length);

  const result: Record<string, DaySettlementEntry> = {};
  for (const pid of participantIds) {
    const gamesTotal = games.reduce((sum, g) => {
      const score = g.scores.find((s) => s.playerId === pid);
      return sum + (score ? score.point : 0);
    }, 0);
    const chipCount = chips[pid] ?? 0;
    const chipValue = chipCount * settings.chipValue;
    const totalWithoutFee = gamesTotal + chipValue;
    const totalWithFee = totalWithoutFee - tableFeeShare;

    result[pid] = {
      gamesTotal,
      chipCount,
      chipValue,
      tableFeeShare,
      totalWithoutFee,
      totalWithFee,
    };
  }
  return result;
}

export function defaultRankPoints(playerCount: PlayerCount): number[] {
  return playerCount === 4 ? [30000, 10000, -10000, -30000] : [20000, 0, -20000];
}

/**
 * Parses a "百の位以上" input (e.g. "582" for a raw score of 58,200) into a full
 * raw score. Returns null for blank/invalid input so callers can distinguish
 * "not yet entered" from an actual value.
 */
export function parseHundredsInput(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n * 100;
}

/** Inverse of parseHundredsInput's scaling, for displaying a raw score in "百点" units. */
export function toHundreds(rawScore: number): number {
  return rawScore / 100;
}
