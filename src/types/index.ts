export type PlayerCount = 3 | 4;

export interface Player {
  id: string;
  name: string;
  /** グラフ上でこの雀士を表す色（hex/hsl）。他の雀士とは重複しない。 */
  color: string;
}

/** All persisted calculation settings. */
export interface Settings {
  playerCount: PlayerCount;
  /** 配給原点 */
  initialScore: number;
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

/**
 * One occurrence of a yakuman (役満) within a hanchan. `yakumanIds` holds
 * more than one id when multiple yakuman compound on the same win (複合).
 * A single hanchan can have multiple `YakumanEvent`s (achieved across
 * different hands within that hanchan).
 */
export interface YakumanEvent {
  id: string;
  playerId: string;
  yakumanIds: string[];
}

/** One recorded hanchan. */
export interface Game {
  id: string;
  scores: GameScore[];
  yakumanEvents?: YakumanEvent[];
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
  /** チップ1枚の金額（円）。日によって変わりうるため、設定ではなく精算時に入力する。 */
  chipRate: number;
  settlement: Record<string, DaySettlementEntry>;
}
