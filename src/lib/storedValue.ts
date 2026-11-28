/** Firestore may return map keys in a different order; array order is significant. */
export function sameStoredValue(left: unknown, right: unknown): boolean {
  const encode = (value: unknown) => JSON.stringify(value, (_key, item) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
  return encode(left) === encode(right);
}
