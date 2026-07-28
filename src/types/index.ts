export type PlayerCount = 3 | 4;

export interface Player {
  id: string;
  name: string;
}

/** All persisted calculation settings. */
export interface Settings {
  playerCount: PlayerCount;
  /** 配給原点 */
  initialScore: number;
  /** チップ1枚の金額（円） */
  chipValue: number;
  /** 割る数（レート相当） */
  divider: number;
  /** 四麻の順位点 (1〜4着), ウマ・オカ込み。length 4 */
  rankPoints4: [number, number, number, number];
  /** 三麻の順位点 (1〜3着), ウマ・オカ込み。length 3 */
  rankPoints3: [number, number, number];
}

/** One player's result within a single hanchan (半荘). */
export interface GameScore {
  playerId: string;
  /** 素点（実点、百の位以下も含む実際の点数） */
  rawScore: number;
  rank: number;
  /** 精算金額（円） */
  point: number;
}

/** One recorded hanchan. */
export interface Game {
  id: string;
  scores: GameScore[];
}

/** Per-player result for a finalized day. */
export interface DaySettlementEntry {
  /** その日の全ゲームの精算金額の合計 */
  gamesTotal: number;
  chipCount: number;
  chipValue: number;
  /** 均等割された場代シェア */
  tableFeeShare: number;
  /** 場代抜きの最終金額 */
  totalWithoutFee: number;
  /** 場代込みの最終金額 */
  totalWithFee: number;
}

/** A finalized day of play (saved to history). */
export interface DayRecord {
  id: string;
  date: string; // ISO timestamp
  games: Game[];
  tableFee: number;
  chips: Record<string, number>;
  settlement: Record<string, DaySettlementEntry>;
}
