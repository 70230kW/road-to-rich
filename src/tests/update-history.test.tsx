import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { UpdateHistorySection } from '../components/updates/UpdateHistorySection';
import { APP_UPDATES } from '../data/updateHistory';

afterEach(cleanup);

describe('update history', () => {
  it('uses three-part versions and concise completed-action descriptions', () => {
    expect(APP_UPDATES.length).toBeGreaterThanOrEqual(10);
    APP_UPDATES.forEach((update) => {
      expect(update.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(update.items.length).toBeGreaterThan(0);
      update.items.forEach((item) => expect(item.change).toMatch(/ました。$/));
    });
  });

  it('selects past releases from the update side menu', () => {
    render(<UpdateHistorySection />);

    expect(screen.getByRole('heading', { name: 'Ver. 2.3.0' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Ver. 1.0.0/ }));

    expect(screen.getByRole('heading', { name: 'Ver. 1.0.0' })).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getByText('半荘入力')).toBeInTheDocument();
    expect(within(table).getByText('素点から順位と精算金額を自動計算できるようにしました。')).toBeInTheDocument();
  });
});
