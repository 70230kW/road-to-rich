import { describe, expect, it } from 'vitest';
import { formatPercentage, formatRatePercentage } from '../lib/format';

describe('percentage formatting', () => {
  it('always displays ratio percentages with one decimal place', () => {
    expect(formatRatePercentage(1)).toBe('100.0%');
    expect(formatRatePercentage(1 / 3)).toBe('33.3%');
    expect(formatRatePercentage(null)).toBe('—');
  });

  it('always displays percentage-scaled values with one decimal place', () => {
    expect(formatPercentage(50)).toBe('50.0%');
    expect(formatPercentage(12.34)).toBe('12.3%');
  });
});
