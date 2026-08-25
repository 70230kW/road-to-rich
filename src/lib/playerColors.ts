/** Curated, visually distinct colors offered for manual selection and used first by auto-assignment. */
export const PLAYER_COLOR_PALETTE: string[] = [
  '#06b6d4', // cyan
  '#e879f9', // fuchsia
  '#34d399', // emerald
  '#fbbf24', // amber
  '#f87171', // rose
  '#818cf8', // indigo
  '#a3e635', // lime
  '#38bdf8', // sky
  '#fb923c', // orange
  '#c084fc', // purple
  '#2dd4bf', // teal
  '#f472b6', // pink
];

const GOLDEN_ANGLE = 137.508;

/** Endless supply of distinct hues for when every palette color is already taken. */
function fallbackColor(seed: number): string {
  const hue = (seed * GOLDEN_ANGLE) % 360;
  return `hsl(${hue.toFixed(1)}, 70%, 58%)`;
}

/** Picks a color not already present in `usedColors`, preferring the curated palette. */
export function pickPlayerColor(usedColors: (string | undefined)[]): string {
  const used = new Set(usedColors.filter((c): c is string => !!c));
  const fromPalette = PLAYER_COLOR_PALETTE.find((c) => !used.has(c));
  if (fromPalette) return fromPalette;

  let seed = used.size;
  let color = fallbackColor(seed);
  while (used.has(color)) {
    seed += 1;
    color = fallbackColor(seed);
  }
  return color;
}

/** Assigns a non-colliding color to every player missing one (migration for pre-existing rooms). */
export function ensurePlayerColors<T extends { color?: string }>(players: T[]): T[] {
  const used: string[] = players.map((p) => p.color).filter((c): c is string => !!c);
  return players.map((p) => {
    if (p.color) return p;
    const color = pickPlayerColor(used);
    used.push(color);
    return { ...p, color };
  });
}
