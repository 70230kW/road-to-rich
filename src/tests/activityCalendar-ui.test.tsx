import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActivityCalendarHeatmap } from '../components/dashboard/ActivityCalendarHeatmap';

describe('activity calendar UI', () => {
  it('keeps clickable activity cells at the same compact height as empty cells', () => {
    render(
      <ActivityCalendarHeatmap
        year={2026}
        activity={new Map([['2026-09-21', 3]])}
        onSelectDate={vi.fn()}
      />,
    );

    const activityCell = screen.getByRole('button', { name: '2026-09-21: 3半荘' });
    expect(activityCell).toHaveClass('activity-calendar-cell', 'min-h-0', 'h-[11px]');
  });
});
