const ADJECTIVES = [
  'neon',
  'cyber',
  'crimson',
  'azure',
  'shadow',
  'lucky',
  'golden',
  'silent',
  'electric',
  'midnight',
];
const NOUNS = ['tiger', 'dragon', 'falcon', 'ronin', 'phoenix', 'wolf', 'samurai', 'koi', 'oni', 'ninja'];

/**
 * Normalizes free-typed room code input into a valid, comparable Firestore
 * path segment: lowercase, hyphen-separated, [a-z0-9-_] only.
 */
export function normalizeRoomCode(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_]/g, '')
    .slice(0, 60);
}

/** Suggests a memorable, low-collision room code for first-time room creation. */
export function generateRoomCode(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${adjective}-${noun}-${suffix}`;
}
