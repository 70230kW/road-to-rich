import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { TabSkeleton } from '../components/common/TabSkeleton';

afterEach(cleanup);

describe('loading UI', () => {
  it('announces connection status while rendering the gold tile reveal', () => {
    const { container } = render(<LoadingScreen label="ルーム ABCD に接続中" />);

    expect(screen.getByRole('status')).toHaveTextContent('ルーム ABCD に接続中');
    expect(container.querySelector('.gold-tile')).toBeInTheDocument();
    expect(container.querySelector('.gold-tile-glyph')).toHaveTextContent('雀');
  });

  it.each([
    ['dashboard', 'data'],
    ['trophies', 'collection'],
    ['updates', 'collection'],
    ['settings', 'form'],
  ])('uses the %s screen skeleton layout', (tab, layout) => {
    const { container } = render(<TabSkeleton tab={tab} />);

    expect(screen.getByRole('status')).toHaveTextContent('画面を読み込み中');
    expect(container.querySelector(`.premium-skeleton-${layout}`)).toBeInTheDocument();
  });

  it('supports a compact nested loading state', () => {
    const { container } = render(<TabSkeleton tab="dashboard" compact label="リーグ分析を読み込み中" />);

    expect(screen.getByRole('status')).toHaveTextContent('リーグ分析を読み込み中');
    expect(container.querySelector('.premium-skeleton.is-compact')).toBeInTheDocument();
    expect(container.querySelector('.skeleton-heading-card')).not.toBeInTheDocument();
  });
});
