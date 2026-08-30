import type { DayRecord, Player } from '../types';

export interface TableRankingRow {
  playerId: string;
  /** targetPlayerId とこの雀士が同卓した半荘数。 */
  gamesTogether: number;
  /** 同卓した対局に限った、targetPlayerId のこの雀士に対する精算ポイント差（プラスなら勝ち）。 */
  profitAgainst: number;
}

/**
 * targetPlayerId を基準に、他の雀士を同卓回数の多い順にランキングする。
 * 一度も同卓していない雀士も 0 回として一覧に含める。
 */
export function computeTableRanking(history: DayRecord[], players: Player[], targetPlayerId: string): TableRankingRow[] {
  const rows = new Map<string, TableRankingRow>();
  players.forEach((p) => {
    if (p.id === targetPlayerId) return;
    rows.set(p.id, { playerId: p.id, gamesTogether: 0, profitAgainst: 0 });
  });

  for (const day of history) {
    for (const game of day.games) {
      const targetScore = game.scores.find((s) => s.playerId === targetPlayerId);
      if (!targetScore) continue;
      for (const score of game.scores) {
        if (score.playerId === targetPlayerId) continue;
        const row = rows.get(score.playerId);
        if (!row) continue;
        row.gamesTogether += 1;
        row.profitAgainst += targetScore.point - score.point;
      }
    }
  }

  return Array.from(rows.values()).sort((a, b) => b.gamesTogether - a.gamesTogether);
}
