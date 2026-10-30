import type { DayRecord, Player } from '../types';

export interface ReplayRow {
  id: string; name: string; profit: number; delta: number; count: number; rank: number | null;
}
export interface ReplayFrame {
  step: number;
  rows: ReplayRow[];
  highlights: string[];
  note?: string;
}

/** Read-only replay of recorded amounts. Never recalculate using today's rules. */
export function buildMatchReplay(day: DayRecord, players: Player[], historyBefore: DayRecord[] = []): ReplayFrame[] {
  const ids = [...new Set(day.games.flatMap(game => game.scores.map(score => score.playerId)))];
  const totals = new Map(ids.map(id => [id, 0]));
  const counts = new Map(ids.map(id => [id, 0]));
  const highs = new Map<string, number>();
  const name = (id: string) => players.find(player => player.id === id)?.name ?? '退会した雀士';
  historyBefore.filter(record => record.id !== day.id && Date.parse(record.date) < Date.parse(day.date))
    .forEach(record => record.games.forEach(game => game.scores.forEach(score => {
      highs.set(score.playerId, Math.max(highs.get(score.playerId) ?? -Infinity, score.rawScore));
    })));
  const rows = (deltas = new Map<string, number>()): ReplayRow[] => {
    const result = ids.map(id => ({ id, name: name(id), profit: totals.get(id)!, delta: deltas.get(id) ?? 0, count: counts.get(id)!, rank: null as number | null }))
      .sort((a, b) => Number(b.count > 0) - Number(a.count > 0) || b.profit - a.profit);
    return result.map(row => ({ ...row, rank: row.count ? result.filter(other => other.count && other.profit > row.profit).length + 1 : null }));
  };
  const frames: ReplayFrame[] = [{ step: 0, rows: rows(), highlights: [] }];
  day.games.forEach((game, index) => {
    const previousLeaders = frames[index].rows.filter(row => row.rank === 1).map(row => row.id);
    const highlights: string[] = [];
    const deltas = new Map<string, number>();
    game.scores.forEach(score => {
      totals.set(score.playerId, totals.get(score.playerId)! + score.point);
      counts.set(score.playerId, counts.get(score.playerId)! + 1);
      deltas.set(score.playerId, score.point);
      const high = highs.get(score.playerId);
      if (high !== undefined && score.rawScore > high) highlights.push(`${name(score.playerId)}が自己最高素点を更新（${score.rawScore.toLocaleString('ja-JP')}点）`);
      highs.set(score.playerId, Math.max(high ?? -Infinity, score.rawScore));
    });
    const nextRows = rows(deltas);
    const leaders = nextRows.filter(row => row.rank === 1);
    if (previousLeaders.length && leaders.length === 1 && !previousLeaders.includes(leaders[0].id)) {
      highlights.unshift(`${leaders[0].name}が単独首位に浮上`);
    }
    frames.push({ step: index + 1, rows: nextRows, highlights, note: game.note });
  });
  return frames;
}
