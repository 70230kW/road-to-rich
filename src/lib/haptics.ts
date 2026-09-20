export type HapticKind = 'light' | 'success' | 'warning';

const PATTERNS: Record<HapticKind, number | number[]> = {
  light: 12,
  success: [18, 35, 28],
  warning: [28, 45, 28],
};

/** Uses supported device vibration without making it a requirement for interaction. */
export function haptic(kind: HapticKind = 'light') {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(PATTERNS[kind]);
}
