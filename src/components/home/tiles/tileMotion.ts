export const TILE_COUNT = 4;
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const mod = (value: number, n = TILE_COUNT) => ((value % n) + n) % n;
export const menuIndex = (position: number) => mod(Math.round(position));
export const nearestPosition = (index: number, position: number) => index + Math.round((position - index) / TILE_COUNT) * TILE_COUNT;
export const signedDistance = (index: number, position: number) => mod(index - position + 2) - 2;

// Only the angle is periodic; position/target never wrap at the 04 / 01 seam.
export function tilePose(index: number, position: number) {
  const angle = (index - mod(position)) * Math.PI * 2 / TILE_COUNT;
  const side = Math.sin(angle), depth = (1 - Math.cos(angle)) / 2;
  const focus = Math.exp(-7.8 * depth), light = .025 + .975 * Math.exp(-5 * depth);
  return { x: side * 2.18, y: .16 + depth * .85, z: .5 - depth * 4.1,
    scale: 1.2 - depth * .46, rx: -.07 + depth * .14, ry: .12 - side * .21,
    rz: -.055 + side * .105, side, depth, focus, light };
}

// Exact critically damped spring, stable at both 15 Hz and 120 Hz.
export function springStep(position: number, target: number, velocity: number, dt: number) {
  const omega = 15, delta = position - target, c = velocity + omega * delta;
  const decay = Math.exp(-omega * dt);
  return { position: target + (delta + c * dt) * decay, velocity: (velocity - omega * c * dt) * decay };
}
