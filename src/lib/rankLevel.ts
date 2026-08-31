import type { DayRecord, Player } from '../types';

/** 段位の大分類。同じ group の段位（雀豪1〜雀豪3 など）は UI 上で同じ色になる。 */
export type RankGroup = '地底人' | '雀士' | '雀傑' | '雀豪' | '雀聖' | '魂天';

export interface RankTier {
  name: string;
  /** この段位に到達するために必要な累計収支（円、場代抜き）。 */
  minProfit: number;
  group: RankGroup;
}

/**
 * 天鳳・雀魂風の段位ラダー。ポイント変換は行わず、実際に勝った金額（場代抜きの累計収支、
 * 総合ランキングと同じ基準）で判定する。段位はトロフィーと違って永久固定ではなく、
 * 現在の累計収支だけを見て毎回再計算する（昇段も降段もあり得る）。
 * 負けが¥15,000を超えている雀士は「地底人」グループ（数字が大きいほど深い）に入る。
 */
export const RANK_TIERS: RankTier[] = [
  { name: '地底人3', minProfit: -150000, group: '地底人' },
  { name: '地底人2', minProfit: -80000, group: '地底人' },
  { name: '地底人1', minProfit: -40000, group: '地底人' },
  { name: '雀士1', minProfit: -15000, group: '雀士' },
  { name: '雀士2', minProfit: 10000, group: '雀士' },
  { name: '雀士3', minProfit: 25000, group: '雀士' },
  { name: '雀傑1', minProfit: 50000, group: '雀傑' },
  { name: '雀傑2', minProfit: 80000, group: '雀傑' },
  { name: '雀傑3', minProfit: 120000, group: '雀傑' },
  { name: '雀豪1', minProfit: 180000, group: '雀豪' },
  { name: '雀豪2', minProfit: 250000, group: '雀豪' },
  { name: '雀豪3', minProfit: 350000, group: '雀豪' },
  { name: '雀聖1', minProfit: 400000, group: '雀聖' },
  { name: '雀聖2', minProfit: 440000, group: '雀聖' },
  { name: '雀聖3', minProfit: 470000, group: '雀聖' },
  { name: '魂天', minProfit: 500000, group: '魂天' },
];

export interface PlayerRankStatus {
  playerId: string;
  /** 累計収支（円、場代抜き）。 */
  cumulativeProfit: number;
  levelIndex: number;
  levelName: string;
  group: RankGroup;
  nextLevelName: string | null;
  /** 次の段位まで必要な収支（円）。最高段位なら null。 */
  profitToNextLevel: number | null;
  /** 現在の段位内での進捗（0〜1）。最高段位なら 1。 */
  progressRatio: number;
}

export function computePlayerRankStatuses(history: DayRecord[], players: Player[]): Record<string, PlayerRankStatus> {
  const cumulative = new Map<string, number>();
  players.forEach((p) => cumulative.set(p.id, 0));

  for (const day of history) {
    for (const [playerId, entry] of Object.entries(day.settlement)) {
      if (!cumulative.has(playerId)) continue;
      cumulative.set(playerId, (cumulative.get(playerId) ?? 0) + entry.totalWithoutFee);
    }
  }

  const result: Record<string, PlayerRankStatus> = {};
  players.forEach((p) => {
    const profit = cumulative.get(p.id) ?? 0;
    let levelIndex = 0;
    for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
      if (profit >= RANK_TIERS[i].minProfit) {
        levelIndex = i;
        break;
      }
    }
    const current = RANK_TIERS[levelIndex];
    const next = RANK_TIERS[levelIndex + 1] ?? null;
    const progressRatio = next
      ? Math.max(0, Math.min(1, (profit - current.minProfit) / (next.minProfit - current.minProfit)))
      : 1;

    result[p.id] = {
      playerId: p.id,
      cumulativeProfit: profit,
      levelIndex,
      levelName: current.name,
      group: current.group,
      nextLevelName: next ? next.name : null,
      profitToNextLevel: next ? Math.max(0, next.minProfit - profit) : null,
      progressRatio,
    };
  });
  return result;
}

export interface RankGroupSummary {
  group: RankGroup;
  /** そのグループに属する段位（雀士1〜3 など）を、しきい値の低い順に並べたもの。 */
  levels: RankTier[];
  /** このグループの下限（円）。 */
  minProfit: number;
  /** このグループの上限（次のグループの下限、円）。最高グループなら null。 */
  maxProfitExclusive: number | null;
}

/** RANK_TIERS を大分類（group）単位でまとめ、各グループの収支レンジを付与する。 */
export function groupRankTiers(): RankGroupSummary[] {
  const groups: RankGroupSummary[] = [];
  for (const tier of RANK_TIERS) {
    const last = groups[groups.length - 1];
    if (last && last.group === tier.group) {
      last.levels.push(tier);
    } else {
      groups.push({ group: tier.group, levels: [tier], minProfit: tier.minProfit, maxProfitExclusive: null });
    }
  }
  for (let i = 0; i < groups.length - 1; i++) {
    groups[i].maxProfitExclusive = groups[i + 1].minProfit;
  }
  return groups;
}
