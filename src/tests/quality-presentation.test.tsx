/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { NeonButton } from '../components/common/NeonButton';

afterEach(cleanup);
describe('shared league presentation', () => {
  it('uses distinct primary/secondary/destructive actions without animated decoration', () => {
    render(<><NeonButton>記録</NeonButton><NeonButton variant="gradient">精算</NeonButton><NeonButton variant="success">開始</NeonButton><NeonButton variant="ghost">戻る</NeonButton><NeonButton variant="danger" disabled>削除</NeonButton></>);
    for (const name of ['記録', '精算', '開始']) expect(screen.getByRole('button', { name })).toHaveClass('league-action-primary');
    expect(screen.getByRole('button', { name: '戻る' })).toHaveClass('league-action-secondary');
    expect(screen.getByRole('button', { name: '削除' })).toHaveClass('league-action-danger');
    expect(screen.getByRole('button', { name: '削除' })).toBeDisabled();
    expect(document.querySelector('.bg-gradient-to-r')).not.toBeInTheDocument();
  });
  it('scopes editorial titles and wrapping to the league, keeping TOP untouched', () => {
    const style = document.createElement('style');
    style.textContent = readFileSync('src/styles/quality.css', 'utf8');
    document.head.append(style);
    try {
      render(<><div className="league-shell"><header className="section-heading"><h2>ダッシュボード</h2></header><div className="player-roster-card"><span className="truncate">長い雀士名</span></div></div><div className="top-screen"><h2>TOP</h2></div><NeonButton>保存</NeonButton></>);
      expect(getComputedStyle(screen.getByText('長い雀士名')).whiteSpace).toBe('normal');
      expect(getComputedStyle(screen.getByText('長い雀士名')).overflowWrap).toBe('anywhere');
      // JSDOM keeps custom properties unresolved in font-family.
      expect(getComputedStyle(screen.getByRole('heading', { name: 'ダッシュボード' })).fontFamily).toBe('var(--font-editorial)');
      expect(getComputedStyle(document.documentElement).getPropertyValue('--font-editorial')).toContain('Mincho');
      expect(getComputedStyle(screen.getByRole('heading', { name: 'TOP' })).fontFamily).not.toContain('Mincho');
      expect(getComputedStyle(screen.getByRole('button', { name: '保存' })).minHeight).toBe('48px');
    } finally { style.remove(); }
  });
});
