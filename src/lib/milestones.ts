import type { DayRecord, Player } from '../types';
import { computeRanking, computePlayerRateStats } from './stats';

export type MilestoneType = 'hanchan-count' | 'top-rate-50' | 'profit-turned-positive' | 'profit-turned-negative';

export interface MilestoneEvent {
  id: string;
  playerId: string;
  type: MilestoneType;
  message: string;
}

const TOP_RATE_MIN_HANCHAN = 5;
const HANCHAN_MILESTONE_STEP = 50;

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * 直近の対局日（同日にダブルヘッダーがあればまとめて1バッチ扱い）を含む前後で、
 * 各雀士の主要指標がしきい値を超えた瞬間だけを検出する。
 * 「既読管理」は行わない（毎回同じ履歴なら同じ結果を返す、状態を持たないシンプル版）。
 */
export function computeLatestMilestones(history: DayRecord[], players: Player[]): MilestoneEvent[] {
  if (history.length === 0) return [];

  const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestKey = dateKey(sorted[0].date);
  const historyBefore = history.filter((day) => dateKey(day.date) !== latestKey);

  const rankingBefore = new Map(computeRanking(historyBefore, players).map((r) => [r.playerId, r]));
  const rankingAfter = new Map(computeRanking(history, players).map((r) => [r.playerId, r]));
  const rateBefore = computePlayerRateStats(historyBefore, players);
  const rateAfter = computePlayerRateStats(history, players);

  const events: MilestoneEvent[] = [];

  for (const player of players) {
    const before = rankingBefore.get(player.id);
    const after = rankingAfter.get(player.id);
    if (!after || after.hanchanCount === 0) continue;

    const beforeCount = before?.hanchanCount ?? 0;
    const afterCount = after.hanchanCount;

    if (Math.floor(afterCount / HANCHAN_MILESTONE_STEP) > Math.floor(beforeCount / HANCHAN_MILESTONE_STEP)) {
      const milestone = Math.floor(afterCount / HANCHAN_MILESTONE_STEP) * HANCHAN_MILESTONE_STEP;
      events.push({
        id: `${player.id}:hanchan-count:${milestone}`,
        playerId: player.id,
        type: 'hanchan-count',
        message: `${player.name} が通算 ${milestone} 半荘を達成！`,
      });
    }

    if (afterCount >= TOP_RATE_MIN_HANCHAN) {
      const beforeTop = beforeCount >= TOP_RATE_MIN_HANCHAN ? (rateBefore[player.id]?.topRate ?? null) : null;
      const afterTop = rateAfter[player.id]?.topRate ?? null;
      if ((beforeTop === null || beforeTop < 0.5) && afterTop !== null && afterTop >= 0.5) {
        events.push({
          id: `${player.id}:top-rate-50`,
          playerId: player.id,
          type: 'top-rate-50',
          message: `${player.name} のトップ率が50%を突破！`,
        });
      }
    }

    if (beforeCount > 0 && before) {
      const beforeProfit = before.totalProfitWithoutFee;
      const afterProfit = after.totalProfitWithoutFee;
      if (beforeProfit <= 0 && afterProfit > 0) {
        events.push({
          id: `${player.id}:profit-turned-positive`,
          playerId: player.id,
          type: 'profit-turned-positive',
          message: `${player.name} の通算収支が黒字に転換！`,
        });
      } else if (beforeProfit >= 0 && afterProfit < 0) {
        events.push({
          id: `${player.id}:profit-turned-negative`,
          playerId: player.id,
          type: 'profit-turned-negative',
          message: `${player.name} の通算収支が赤字に転落…`,
        });
      }
    }
  }

  return events;
}
