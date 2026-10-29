import { clamp, signedDistance } from './tileMotion';

// Local Japanese Mincho faces: no network font request on the entry screen.
export const MINCHO_FONT = '"Hiragino Mincho ProN", "Yu Mincho", "YuMincho", "Noto Serif JP", "MS PMincho", serif';
export const TITLE_DEPTH = -.8;
export const FALLBACK_TITLE_LAYER = 75;

export function titleLines(name: string): string[] {
  if (name === '対局入力') return ['対局', '入力'];
  if (name === 'ダッシュボード') return ['ダッシュ', 'ボード'];
  return [name];
}

/** Normalized, non-overlapping reading and tile zones, shared with the fallback. */
export function tileLayout(width: number, height: number) {
  const portrait = width / Math.max(1, height) < 1.15;
  return portrait ? {
    title: { left: .06, top: .025, width: .88, height: .32 },
    tile: { x: .54, y: .69, width: .70, height: .55 },
  } : {
    title: { left: .06, top: .12, width: .41, height: .76 },
    tile: { x: .75, y: .52, width: .42, height: .80 },
  };
}

/** Fit a conservative focused-tile envelope, including tilt and perspective. */
export function tileComposition(width: number, height: number, fov = 30, cameraZ = 8.8) {
  const layout = tileLayout(width, height);
  const worldHeight = 2 * Math.tan(fov * Math.PI / 360) * cameraZ;
  const worldWidth = worldHeight * width / Math.max(1, height);
  const fit = (size: number, envelope: number) => size / (envelope + size * .8 / cameraZ);
  const scale = Math.min(1.3, fit(worldWidth * layout.tile.width, 2.25), fit(worldHeight * layout.tile.height, 2.9));
  const perspective = 1 - .5 * scale / cameraZ;
  return { layout, scale,
    x: (layout.tile.x - .5) * worldWidth * perspective,
    y: (.5 - layout.tile.y) * worldHeight * perspective - .16 * scale,
  };
}

export function titleFrame(index: number, position: number, reduced: boolean) {
  const distance = signedDistance(index, position);
  return { opacity: clamp(1 - Math.abs(distance) * 1.35, 0, 1), offset: reduced ? 0 : distance * .055 };
}
