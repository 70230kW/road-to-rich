/// <reference types="node" />
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Trophy } from 'lucide-react';
import { readFileSync } from 'node:fs';
import { StatCard } from '../components/common/StatCard';

// Vitest stubs CSS imports; read the real stylesheet for CSSOM assertions.
const editorial = readFileSync('src/styles/editorial.css', 'utf8');

let style: HTMLStyleElement;
beforeEach(() => {
  style = document.createElement('style');
  // Exercise the presentation layer against existing card/control styles.
  style.textContent = `
    :root { --premium-line: #30343b; --premium-gold: #cdb780; }
    .test-surface { border: 1px solid #777; border-radius: 16px; background: #222; box-shadow: 0 2px 8px #000; }
    .test-control { border: 1px solid #999; border-radius: 8px; background: #333; }
    .test-dialog { border: 1px solid #666; border-radius: 20px; background: #111; }
    ${editorial}`;
  document.head.append(style);
  expect(style.sheet?.cssRules.length).toBeGreaterThan(20);
});
afterEach(() => { cleanup(); style.remove(); });

describe('open editorial presentation', () => {
  it.each([
    'section-heading', 'premium-panel', 'unified-panel', 'unified-section',
    'performance-hero', 'rank-progress-card', 'ranking-target', 'hub-career',
    'hub-match', 'hub-panel', 'trophy-overview', 'collection-card',
    'player-add-panel', 'player-roster-card', 'rule-card', 'setting-card',
    'season-active-card', 'season-create-card', 'match-session-setup',
    'match-session-live', 'insight-panel', 'match-result-stage', 'updates-content',
    'history-filters', 'rule-search', 'editorial-section', 'editorial-row',
    'editorial-history', 'editorial-table', 'editorial-stat',
  ])('removes the outer box from %s without removing its content', name => {
    render(<main className="app-content"><section className={`test-surface ${name}`} data-testid="surface">記録はそのまま</section></main>);
    const surface = screen.getByTestId('surface');
    const computed = getComputedStyle(surface);
    expect(computed.borderRadius).toBe('0px');
    expect(computed.borderLeftWidth).toBe('0px');
    expect(computed.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(computed.boxShadow).toBe('none');
    expect(screen.getByText('記録はそのまま')).toBeVisible();
  });

  it('preserves form control and dialog boundaries inside an open section', () => {
    render(<main className="app-content"><section className="unified-panel">
      <label>素点<input className="test-control" /></label>
      <label>雀士<select className="test-control"><option>和賀</option></select></label>
      <button className="test-control">保存</button>
      <div role="dialog" className="test-dialog">確認</div>
    </section></main>);
    for (const control of [screen.getByLabelText('素点'), screen.getByLabelText('雀士'), screen.getByRole('button')]) {
      expect(getComputedStyle(control).borderLeftWidth).toBe('1px');
      expect(getComputedStyle(control).borderRadius).toBe('8px');
    }
    expect(getComputedStyle(screen.getByRole('dialog')).borderRadius).toBe('20px');
  });

  it('keeps metric details as real buttons and noninteractive metrics as text', () => {
    const open = vi.fn();
    render(<main className="app-content">
      <StatCard title="最多半荘" value="120" color="yellow" icon={<Trophy />} onClick={open} />
      <StatCard title="総半荘" value="200" color="sky" icon={<Trophy />} />
    </main>);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /最多半荘/ }));
    expect(open).toHaveBeenCalledOnce();
    expect(screen.getByText('総半荘')).toBeVisible();
  });
});
