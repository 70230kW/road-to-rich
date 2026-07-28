/** Formats a signed yen amount with a leading +/- and thousands separators. */
export function formatSignedYen(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded.toLocaleString('ja-JP')}`;
}

export function formatYen(value: number): string {
  return Math.round(value).toLocaleString('ja-JP');
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
