import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BarChart3, Crown, Plus } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { MoreMenu } from '../components/layout/MoreMenu';
import { PullToRefresh } from '../components/layout/PullToRefresh';

afterEach(cleanup);

describe('global navigation', () => {
  it('opens the hamburger menu from the shared header', () => {
    const onOpenMenu = vi.fn();
    render(<Header playerSelect={<span>和賀</span>} onOpenMenu={onOpenMenu} />);

    fireEvent.click(screen.getByRole('button', { name: 'メニューを開く' }));
    expect(onOpenMenu).toHaveBeenCalledOnce();
  });

  it('shows primary and secondary destinations in one accessible drawer', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <MoreMenu
        tabs={[
          { id: 'ranking', name: '順位表', icon: Crown },
          { id: 'dashboard', name: 'ダッシュボード', icon: BarChart3 },
          { id: 'input', name: '記録', icon: Plus },
        ]}
        activeTab="ranking"
        onSelect={onSelect}
        onRefresh={vi.fn().mockResolvedValue(undefined)}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'メニュー' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /順位表/ })).toHaveAttribute('aria-current', 'page');
    fireEvent.click(screen.getByRole('button', { name: 'ダッシュボード' }));
    expect(onSelect).toHaveBeenCalledWith('dashboard');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('pull to refresh', () => {
  it('refreshes after the user pulls beyond the threshold at the top of the screen', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<PullToRefresh onRefresh={onRefresh}><main>画面内容</main></PullToRefresh>);

    fireEvent.touchStart(window, { touches: [{ clientY: 0 }] });
    fireEvent.touchMove(window, { touches: [{ clientY: 200 }] });
    expect(screen.getByRole('status')).toHaveTextContent('離して更新');
    fireEvent.touchEnd(window, { touches: [] });

    await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
    expect(screen.getByRole('status')).toHaveTextContent('最新の状態です');
  });
});
