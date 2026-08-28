import type { DayRecord, Player } from '../types';

export interface HallOfFameRecord {
  playerId: string;
  playerName: string;
  value: number;
  date: string;
  /** 快勝・大接戦: 相手（2着）の名前。 */
  opponentName?: string;
  /** 大逆転: その日、最も落ち込んだ時点の収支（マイナス）。 */
  lowPoint?: number;
}

export interface HallOfFame {
  /** 快勝: 1半荘内での1着と2着の素点差が最大だった一局。 */
  blowout: HallOfFameRecord | null;
  /** 大逆転: 1日の中で最も落ち込んだ地点から、最終的に最も収支を伸ばした記録。 */
  comeback: HallOfFameRecord | null;
  /** 大接戦: 1半荘内での1着と2着の素点差が最小だった一局。 */
  nailbiter: HallOfFameRecord | null;
  /** 大爆死: 記録上最も低い素点。 */
  bust: HallOfFameRecord | null;
}

function playerName(players: Player[], id: string): string {
  return players.find((p) => p.id === id)?.name ?? '不明な雀士';
}

/** 対局データから自動的に「名場面」を抽出する。history はシーズン絞り込み後のものでよい（ランキング等と同じスコープ）。 */
export function computeHallOfFame(history: DayRecord[], players: Player[]): HallOfFame {
  let blowout: HallOfFameRecord | null = null;
  let nailbiter: HallOfFameRecord | null = null;
  let bust: HallOfFameRecord | null = null;
  let comeback: HallOfFameRecord | null = null;

  for (const day of history) {
    for (const game of day.games) {
      const rank1 = game.scores.find((s) => s.rank === 1);
      const rank2 = game.scores.find((s) => s.rank === 2);
      if (rank1 && rank2) {
        const gap = rank1.rawScore - rank2.rawScore;
        if (blowout === null || gap > blowout.value) {
          blowout = {
            playerId: rank1.playerId,
            playerName: playerName(players, rank1.playerId),
            value: gap,
            date: day.date,
            opponentName: playerName(players, rank2.playerId),
          };
        }
        if (nailbiter === null || gap < nailbiter.value) {
          nailbiter = {
            playerId: rank1.playerId,
            playerName: playerName(players, rank1.playerId),
            value: gap,
            date: day.date,
            opponentName: playerName(players, rank2.playerId),
          };
        }
      }
      for (const score of game.scores) {
        if (bust === null || score.rawScore < bust.value) {
          bust = { playerId: score.playerId, playerName: playerName(players, score.playerId), value: score.rawScore, date: day.date };
        }
      }
    }

    // 大逆転: その日出場した各雀士について、半荘を記録順に積み上げた収支の推移を見て、
    // 一番落ち込んだ地点から最終的にどれだけ盛り返したかを調べる。
    const runningByPlayer = new Map<string, number[]>();
    for (const game of day.games) {
      const seenThisGame = new Set<string>();
      for (const score of game.scores) {
        seenThisGame.add(score.playerId);
      }
      // Advance every player's running total for this hanchan (0 if they sat it out).
      const involvedIds = new Set([...runningByPlayer.keys(), ...seenThisGame]);
      involvedIds.forEach((pid) => {
        const prevSeries = runningByPlayer.get(pid) ?? [0];
        const delta = game.scores.find((s) => s.playerId === pid)?.point ?? 0;
        prevSeries.push(prevSeries[prevSeries.length - 1] + delta);
        runningByPlayer.set(pid, prevSeries);
      });
    }
    runningByPlayer.forEach((series, playerId) => {
      if (series.length < 3) return; // needs >=2 hanchans that day (series includes the leading 0)
      const min = Math.min(...series);
      const final = series[series.length - 1];
      const comebackAmount = final - min;
      if (min < 0 && comebackAmount > 0 && (comeback === null || comebackAmount > comeback.value)) {
        comeback = { playerId, playerName: playerName(players, playerId), value: comebackAmount, date: day.date, lowPoint: min };
      }
    });
  }

  return { blowout, comeback, nailbiter, bust };
}
