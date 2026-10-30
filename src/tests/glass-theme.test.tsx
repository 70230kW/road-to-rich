/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

const css = readFileSync('src/styles/obsidian-glass.css', 'utf8');
let style: HTMLStyleElement;
beforeEach(() => {
  document.body.classList.add('glass-theme');
  style = document.createElement('style');
  style.textContent = readFileSync('src/styles/editorial.css', 'utf8') + readFileSync('src/styles/quality.css', 'utf8') + css;
  document.head.append(style);
  expect(style.sheet!.cssRules.length).toBeGreaterThan(50);
});
afterEach(() => { cleanup(); style.remove(); document.body.classList.remove('glass-theme'); });

describe('obsidian glass presentation coverage (CSSOM, not visual layout)', () => {
  it.each(['hub-career', 'hub-match', 'hub-panel', 'ranking-target', 'performance-hero',
    'rank-hero', 'rank-progress-card', 'unified-panel', 'unified-section', 'editorial-section',
    'premium-panel', 'player-add-panel', 'setting-card', 'match-session-setup', 'match-session-live',
    'match-result-stage', 'trophy-overview', 'collection-card', 'season-active-card', 'season-create-card',
    'updates-content', 'recent-trends', 'match-replay', 'save-receipt'])('gives %s a shared glass surface', name => {
    render(<main className="app-content"><section className={name} data-testid="surface">内容</section></main>);
    expect(getComputedStyle(screen.getByTestId('surface')).boxShadow).toBe('var(--glass-shadow)');
  });
  it('keeps headings, nested analysis and metric rows free of stacked outer shadows', () => {
    render(<main className="app-content"><header className="section-heading">見出し</header>
      <section className="unified-panel"><div className="editorial-section">内側</div></section>
      <div className="editorial-row">行</div><div className="editorial-stat">指標</div></main>);
    for (const name of ['見出し', '内側', '行', '指標']) expect(getComputedStyle(screen.getByText(name)).boxShadow).toBe('none');
  });
  it('provides defined fields without replacing native checkboxes or range controls', () => {
    render(<><label>名前<input /></label><label>雀士<select><option>和賀</option></select></label>
      <label>メモ<textarea /></label><label>参加<input type="checkbox" /></label><input type="range" aria-label="推移" /></>);
    for (const name of ['名前', '雀士', 'メモ']) expect(getComputedStyle(screen.getByLabelText(name)).boxShadow).toBe('var(--glass-field)');
    for (const name of ['参加', '推移']) expect(getComputedStyle(screen.getByLabelText(name)).boxShadow).not.toBe('var(--glass-field)');
  });
  it('marks selection with jade light plus weight and a persistent underline', () => {
    render(<div className="density-switch"><button aria-pressed="true">詳細</button><button aria-pressed="false">シンプル</button></div>);
    const selected = getComputedStyle(screen.getByText('詳細'));
    expect(selected.boxShadow).toBe('var(--glass-selected)');
    expect(selected.fontWeight).toBe('700');
    expect(selected.borderBottomColor).toBe('var(--glass-signal)');
    expect(getComputedStyle(screen.getByText('シンプル')).boxShadow).toBe('none');
  });
  it('styles portals without disturbing cancel, destructive confirmation or positioning', () => {
    const confirm = vi.fn(), cancel = vi.fn();
    render(<ConfirmDialog open title="設定を解除" message="記録は保持されます" onConfirm={confirm} onCancel={cancel} />);
    const panel = document.querySelector('.confirm-dialog-panel')!;
    expect(getComputedStyle(panel).boxShadow).toBe('var(--glass-float)');
    expect(screen.getByRole('button', { name: '実行する' })).toHaveClass('glass-danger');
    expect(screen.getByRole('dialog')).toHaveClass('items-center', 'justify-center');
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(cancel).toHaveBeenCalledOnce(); expect(confirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '実行する' }));
    expect(confirm).toHaveBeenCalledOnce();
  });
  it('keeps TOP tile artwork, share export layouts and semantic profit colors untouched', () => {
    render(<><div className="jk-fallback-tile" data-testid="tile" /><article className="result-share-card" data-testid="share" />
      <strong className="profit-negative">-100</strong></>);
    for (const id of ['tile', 'share']) expect(getComputedStyle(screen.getByTestId(id)).boxShadow).not.toBe('var(--glass-shadow)');
    expect(css).not.toContain('.profit-negative');
    expect(css).not.toContain('.jk-stage');
  });
  it('activates the same theme in production and the isolated QA entry', () => {
    for (const path of ['index.html', 'qa/home-menu.html']) expect(readFileSync(path, 'utf8')).toContain('class="glass-theme"');
    for (const path of ['src/main.tsx', 'qa/home-menu.tsx']) expect(readFileSync(path, 'utf8')).toContain('styles/obsidian-glass.css');
    const manifest = JSON.parse(readFileSync('public/site.webmanifest', 'utf8'));
    expect(manifest.theme_color).toBe('#0b0d10');
    expect(manifest.background_color).toBe('#0b0d10');
    expect(readFileSync('index.html', 'utf8')).toContain('name="theme-color" content="#0b0d10"');
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toContain('prefers-contrast: more');
    expect(css).toContain('prefers-reduced-transparency: reduce');
    expect(css).toContain('forced-colors: active');
  });
  it('has at least 4.5:1 token contrast, even over a bright backdrop behind the glass', () => {
    const rgb = (hex: string) => hex.match(/[a-f0-9]{2}/gi)!.map(value => parseInt(value, 16));
    const over = (foreground: string, background: number[]) => {
      const [r, g, b, alpha = 255] = rgb(foreground);
      return [r, g, b].map((value, i) => value * alpha / 255 + background[i] * (1 - alpha / 255));
    };
    const luminance = (values: number[]) => {
      const channels = values.map(value => value / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    };
    const token = (name: string) => css.match(new RegExp(`--glass-${name}: (#[a-f0-9]{6})`))![1];
    // Maximum sheen + translucent fill + white behind it is a conservative backdrop.
    const support = css.slice(css.indexOf('@supports'));
    const fill = support.match(/--glass-panel-fill: (#[a-f0-9]{8})/)![1];
    const chrome = support.match(/--glass-chrome-fill: (#[a-f0-9]{8})/)![1];
    const backgrounds = [rgb(token('base')), rgb(token('panel-fill')), over('#d5f7ff09', over(fill, [255, 255, 255])), over('#bcebe90a', over(chrome, [255, 255, 255]))];
    const pairs = ['text', 'muted', 'gold', 'signal'].flatMap(name => backgrounds.map(background => [rgb(token(name)), background]));
    pairs.push([rgb('#191b16'), rgb('#d9bd82')]);
    for (const [foreground, background] of pairs) {
      const [a, b] = [luminance(foreground), luminance(background)].sort((a,b) => b-a);
      expect((a+.05)/(b+.05)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('preserves PR #99 black bases and removes the old theme from both entry points', () => {
    expect(getComputedStyle(document.body).getPropertyValue('--glass-base').trim()).toBe('#0b0d10');
    expect(getComputedStyle(document.body).getPropertyValue('--glass-top').trim()).toBe('#090d10');
    for (const path of ['src/main.tsx', 'qa/home-menu.tsx', 'index.html', 'qa/home-menu.html']) {
      expect(readFileSync(path, 'utf8')).not.toMatch(/neu-theme|neumorphic\.css/);
    }
  });
  it('uses a supported, bounded blur layer with opaque and accessibility fallbacks', () => {
    const rules = Array.from(style.sheet!.cssRules);
    const support = rules.find(rule => rule.cssText.startsWith('@supports')) as CSSGroupingRule;
    expect(support.cssText).toContain('-webkit-backdrop-filter');
    expect(support.cssText).toContain('--glass-panel-fill: #111a20d9');
    expect(support.cssText).not.toMatch(/\.editorial-row|\.leaderboard-row|\.score-seat|\.jk-webgl/);
    const reduced = rules.find(rule => rule.cssText.startsWith('@media (prefers-reduced-transparency'))!;
    expect(reduced.cssText).toContain('--glass-panel-fill: #131b20');
    expect(reduced.cssText).toContain('backdrop-filter: none !important');
    expect(css).not.toContain('@keyframes');
  });
  it('keeps semantic errors, member selection and disabled actions distinguishable', () => {
    render(<><input aria-label="素点" aria-invalid="true" />
      <div className="session-member-row" data-selected="true">参加雀士</div>
      <button className="glass-button glass-primary" disabled>保存</button></>);
    // jsdom does not expand custom properties inside border-color shorthands.
    expect(getComputedStyle(screen.getByLabelText('素点')).outline).toBe('1px solid var(--glass-danger)');
    expect(getComputedStyle(screen.getByText('参加雀士')).boxShadow).toContain('var(--glass-signal)');
    expect(getComputedStyle(screen.getByRole('button')).boxShadow).toBe('none');
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
