import { clamp, signedDistance } from './tileMotion';

// Local Japanese Mincho faces: no network font request on the entry screen.
export const MINCHO_FONT = '"Hiragino Mincho ProN", "Yu Mincho", "YuMincho", "Noto Serif JP", "MS PMincho", serif';
export const TITLE_WIDTH = .94;
export const TITLE_DEPTH = -.8;
export const FALLBACK_TITLE_LAYER = 75;

export function titleFrame(index: number, position: number, reduced: boolean) {
  const distance = signedDistance(index, position);
  return { opacity: clamp(1 - Math.abs(distance) * 1.35, 0, 1), offset: reduced ? 0 : distance * .055 };
}
