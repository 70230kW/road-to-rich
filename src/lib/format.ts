/** Formats a signed yen amount with a leading +/- and thousands separators. */
export function formatSignedYen(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded.toLocaleString('ja-JP')}`;
}

export function formatYen(value: number): string {
  return Math.round(value).toLocaleString('ja-JP');
}

/** Formats a 0-1 ratio as a percentage with exactly one decimal place. */
export function formatRatePercentage(value: number | null | undefined, fallback = '—'): string {
  return value == null ? fallback : `${(value * 100).toFixed(1)}%`;
}

/** Formats an already percentage-scaled value with exactly one decimal place. */
export function formatPercentage(value: number | null | undefined, fallback = '—'): string {
  return value == null ? fallback : `${value.toFixed(1)}%`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}
