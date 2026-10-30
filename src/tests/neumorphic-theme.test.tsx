/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

const css = readFileSync('src/styles/neumorphic.css', 'utf8');
let style: HTMLStyleElement;
beforeEach(() => {
  document.body.classList.add('neu-theme');
  style = document.createElement('style');
  style.textContent = readFileSync('src/styles/editorial.css', 'utf8') + readFileSync('src/styles/quality.css', 'utf8') + css;
  document.head.append(style);
  expect(style.sheet!.cssRules.length).toBeGreaterThan(50);
});
afterEach(() => { cleanup(); style.remove(); document.body.classList.remove('neu-theme'); });

describe('neumorphic presentation coverage (CSSOM, not visual layout)', () => {
  it.each(['hub-career', 'hub-match', 'hub-panel', 'ranking-target', 'performance-hero',
    'rank-hero', 'rank-progress-card', 'unified-panel', 'unified-section', 'editorial-section',
    'premium-panel', 'player-add-panel', 'setting-card', 'match-session-setup', 'match-session-live',
    'match-result-stage', 'trophy-overview', 'collection-card', 'season-active-card', 'season-create-card',
    'updates-content', 'recent-trends', 'match-replay', 'save-receipt'])('gives %s a shared raised surface', name => {
    render(<main className="app-content"><section className={name} data-testid="surface">内容</section></main>);
    expect(getComputedStyle(screen.getByTestId('surface')).boxShadow).toBe('var(--neu-raised)');
  });
  it('keeps headings, nested analysis and metric rows free of stacked outer shadows', () => {
    render(<main className="app-content"><header className="section-heading">見出し</header>
      <section className="unified-panel"><div className="editorial-section">内側</div></section>
      <div className="editorial-row">行</div><div className="editorial-stat">指標</div></main>);
    for (const name of ['見出し', '内側', '行', '指標']) expect(getComputedStyle(screen.getByText(name)).boxShadow).toBe('none');
  });
  it('provides inset inputs without replacing native checkboxes or range controls', () => {
    render(<><label>名前<input /></label><label>雀士<select><option>和賀</option></select></label>
      <label>メモ<textarea /></label><label>参加<input type="checkbox" /></label><input type="range" aria-label="推移" /></>);
    for (const name of ['名前', '雀士', 'メモ']) expect(getComputedStyle(screen.getByLabelText(name)).boxShadow).toBe('var(--neu-inset)');
    for (const name of ['参加', '推移']) expect(getComputedStyle(screen.getByLabelText(name)).boxShadow).not.toBe('var(--neu-inset)');
  });
  it('marks selection with both an inset and a non-shadow cue', () => {
    render(<div className="density-switch"><button aria-pressed="true">詳細</button><button aria-pressed="false">シンプル</button></div>);
    const selected = getComputedStyle(screen.getByText('詳細'));
    expect(selected.boxShadow).toBe('var(--neu-inset)');
    expect(selected.fontWeight).toBe('700');
    expect(getComputedStyle(screen.getByText('シンプル')).boxShadow).toBe('none');
  });
  it('styles portals without disturbing cancel, destructive confirmation or positioning', () => {
    const confirm = vi.fn(), cancel = vi.fn();
    render(<ConfirmDialog open title="設定を解除" message="記録は保持されます" onConfirm={confirm} onCancel={cancel} />);
    const panel = document.querySelector('.confirm-dialog-panel')!;
    expect(getComputedStyle(panel).boxShadow).toBe('var(--neu-float)');
    expect(screen.getByRole('button', { name: '実行する' })).toHaveClass('neu-danger');
    expect(screen.getByRole('dialog')).toHaveClass('items-center', 'justify-center');
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(cancel).toHaveBeenCalledOnce(); expect(confirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '実行する' }));
    expect(confirm).toHaveBeenCalledOnce();
  });
  it('keeps TOP tile artwork, share export layouts and semantic profit colors untouched', () => {
    render(<><div className="jk-fallback-tile" data-testid="tile" /><article className="result-share-card" data-testid="share" />
      <strong className="profit-negative">-100</strong></>);
    for (const id of ['tile', 'share']) expect(getComputedStyle(screen.getByTestId(id)).boxShadow).not.toBe('var(--neu-raised)');
    expect(css).not.toContain('.profit-negative');
    expect(css).not.toContain('.jk-stage');
  });
  it('activates the same theme in production and the isolated QA entry', () => {
    for (const path of ['index.html', 'qa/home-menu.html']) expect(readFileSync(path, 'utf8')).toContain('class="neu-theme"');
    for (const path of ['src/main.tsx', 'qa/home-menu.tsx']) expect(readFileSync(path, 'utf8')).toContain('styles/neumorphic.css');
    const manifest = JSON.parse(readFileSync('public/site.webmanifest', 'utf8'));
    expect(manifest.theme_color).toBe('#272c33');
    expect(manifest.background_color).toBe('#272c33');
    expect(readFileSync('index.html', 'utf8')).toContain('name="theme-color" content="#272c33"');
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toContain('prefers-contrast: more');
    expect(css).toContain('forced-colors: active');
  });
  it('has at least 4.5:1 contrast for normal text and primary action labels', () => {
    const luminance = (hex: string) => {
      const channels = hex.match(/[a-f0-9]{2}/gi)!.map(value => parseInt(value, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    };
    const token = (name: string) => css.match(new RegExp(`--neu-${name}: (#[a-f0-9]{6})`))![1];
    for (const [foreground, background] of [[token('text'), token('base')], [token('muted'), token('base')], [token('gold'), token('base')], ['#242116', '#cbb17f']]) {
      const [a, b] = [luminance(foreground), luminance(background)].sort((a,b) => b-a);
      expect((a+.05)/(b+.05)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
