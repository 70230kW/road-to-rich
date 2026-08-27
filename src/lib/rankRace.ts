import type { DayRecord, Player } from '../types';
import { computeCumulativeSeries } from './stats';

export interface RankRacePoint {
  label: string;
  dayId: string | null;
  /** playerId -> その時点での順位（1位が最良）。同着は登場順で連番になる（1,2,3,...）。 */
  ranks: Record<string, number>;
}

export interface RankRaceSeries {
  points: RankRacePoint[];
  activePlayers: Player[];
}

/**
 * 累計収支推移（computeCumulativeSeries と同じ「場代込み」累計値）を基に、
 * 各時点での順位を算出する。バンプチャート（順位レース）描画用。
 */
export function computeRankRaceSeries(history: DayRecord[], players: Player[]): RankRaceSeries {
  const { points, activePlayers } = computeCumulativeSeries(history, players);

  const racePoints: RankRacePoint[] = points.map((point) => {
    const entries = activePlayers.map((p) => [p.id, point.values[p.id] ?? 0] as const);
    entries.sort((a, b) => b[1] - a[1]);
    const ranks: Record<string, number> = {};
    entries.forEach(([id], idx) => {
      ranks[id] = idx + 1;
    });
    return { label: point.label, dayId: point.dayId, ranks };
  });

  return { points: racePoints, activePlayers };
}
