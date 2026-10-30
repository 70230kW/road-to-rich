import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HanchanForm } from '../components/input/HanchanForm';
import { useScoreWorkspace } from '../components/input/useScoreWorkspace';
import { defaultSettings } from '../lib/defaults';
import type { PlayerCount } from '../types';

const players = ['a', 'b', 'c', 'd'].map(id => ({ id, name: `雀士${id}`, color: '#cdb780' }));
const save = vi.fn(async () => 'saved');
function form(count: PlayerCount = 4, draftKey?: string) {
  return render(<HanchanForm players={players} settings={{ ...defaultSettings, playerCount: count }} currentDayGames={[]} onAddGame={save} onRemoveGame={vi.fn()} onUpdateGameYakuman={vi.fn()} onStartSettling={vi.fn()} onNavigateToPlayers={vi.fn()} onSetPlayerCount={vi.fn()} draftKey={draftKey} />);
}
function selectPlayers(count = 4) { for (let i = 0; i < count; i++) fireEvent.change(screen.getByRole('combobox', { name: `席${i + 1}の雀士` }), { target: { value: players[i].id } }); }
function score(seat: number) { return screen.getByRole('spinbutton', { name: `席${seat}の素点 (百点単位)` }); }
beforeEach(() => { localStorage.clear(); save.mockClear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('one-handed score entry', () => {
  it.each([3, 4] as const)('advances through %i-player scores and confirms without saving on Enter', count => {
    form(count); selectPlayers(count);
    for (let i = 1; i < count; i++) {
      fireEvent.change(score(i), { target: { value: '250' } });
      fireEvent.keyDown(score(i), { key: 'Enter' });
      if (i < count - 1) expect(score(i + 1)).toHaveFocus();
    }
    expect(screen.getByLabelText('入力内容の確認')).toHaveFocus();
    expect(screen.getByLabelText('入力内容の確認')).toHaveTextContent('合計一致');
    expect(screen.getByLabelText('入力中の暫定順位')).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });
  it('focuses the missing player, then the missing score with its inline explanation', () => {
    form();
    fireEvent.click(screen.getByRole('button', { name: 'この半荘を記録する' }));
    expect(screen.getByRole('combobox', { name: '席1の雀士' })).toHaveFocus();
    expect(screen.getByRole('combobox', { name: '席1の雀士' })).toHaveAttribute('aria-invalid', 'true');
    selectPlayers();
    fireEvent.change(score(1), { target: { value: '250' } });
    fireEvent.click(screen.getByRole('button', { name: '入力を確認' }));
    expect(score(2)).toHaveFocus();
    expect(score(2)).toHaveAccessibleDescription('素点を入力してください');
    expect(save).not.toHaveBeenCalled();
  });
  it('uses the near-field next button and handles auto-calculated seat selection', () => {
    form();
    fireEvent.click(screen.getAllByRole('button', { name: '次の雀士へ' })[0]);
    expect(screen.getByRole('combobox', { name: '席2の雀士' })).toHaveFocus();
    for (let i = 0; i < 3; i++) fireEvent.change(screen.getByRole('combobox', { name: `席${i + 1}の雀士` }), { target: { value: players[i].id } });
    fireEvent.click(screen.getByRole('button', { name: '入力を確認' }));
    expect(screen.getByRole('combobox', { name: '席4の雀士' })).toHaveFocus();
  });
  it('preserves draft restoration, negative amounts and explicit save', async () => {
    const key = 'quality-draft';
    form(3, key); selectPlayers(3);
    fireEvent.change(score(1), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: '席1の素点の符号を切り替える' }));
    fireEvent.change(score(2), { target: { value: '350' } });
    expect(score(1)).toHaveValue(-50);
    expect(JSON.parse(localStorage.getItem(key)!).manualInputs).toEqual(['-50', '350']);
    cleanup(); form(3, key);
    expect(score(1)).toHaveValue(-50);
    fireEvent.click(screen.getByRole('button', { name: 'この半荘を記録する' }));
    await screen.findByRole('heading', { name: '半荘を保存しました' });
    expect(save).toHaveBeenCalledOnce();
  });
});

function Workspace({ enabled = true }: { enabled?: boolean }) {
  const state = useScoreWorkspace(enabled);
  return <div><output data-testid="viewport">{JSON.stringify(state)}</output><div data-score-entry><input aria-label="入力" /><button type="button">内容確認</button></div><input aria-label="対象外" /></div>;
}
describe('score visual viewport lifecycle', () => {
  it('tracks keyboard resize, retains inset while closing, ignores zoom and resets on exit', async () => {
    const viewport = Object.assign(new EventTarget(), { height: 800, offsetTop: 0, scale: 1 });
    vi.stubGlobal('visualViewport', viewport); vi.stubGlobal('innerHeight', 800);
    const view = render(<Workspace />);
    act(() => screen.getByLabelText('入力').focus());
    await waitFor(() => expect(screen.getByTestId('viewport')).toHaveTextContent('"focused":true'));
    act(() => { viewport.height = 450; viewport.offsetTop = 30; viewport.dispatchEvent(new Event('resize')); });
    await waitFor(() => expect(screen.getByTestId('viewport')).toHaveTextContent('"keyboardInset":320'));
    act(() => screen.getByRole('button').focus());
    await waitFor(() => expect(screen.getByTestId('viewport')).toHaveTextContent('"keyboardInset":320'));
    act(() => { viewport.height = 800; viewport.offsetTop = 0; viewport.dispatchEvent(new Event('resize')); });
    await waitFor(() => expect(screen.getByTestId('viewport')).toHaveTextContent('"focused":false'));
    act(() => { viewport.scale = 2; viewport.height = 400; screen.getByLabelText('入力').focus(); viewport.dispatchEvent(new Event('resize')); });
    await waitFor(() => expect(screen.getByTestId('viewport')).toHaveTextContent('"keyboardInset":0'));
    view.rerender(<Workspace enabled={false} />);
    expect(screen.getByTestId('viewport')).toHaveTextContent('"focused":false');
  });
  it('cleans up listeners and pending frames, and works without visualViewport', async () => {
    vi.stubGlobal('visualViewport', undefined);
    const remove = vi.spyOn(document, 'removeEventListener');
    const view = render(<Workspace />);
    act(() => screen.getByLabelText('対象外').focus());
    await waitFor(() => expect(screen.getByTestId('viewport')).toHaveTextContent('"focused":false'));
    act(() => screen.getByLabelText('入力').focus());
    await waitFor(() => expect(screen.getByTestId('viewport')).toHaveTextContent('"focused":true'));
    expect(screen.getByTestId('viewport')).toHaveTextContent('"keyboardInset":0');
    view.unmount();
    expect(remove).toHaveBeenCalledWith('focusin', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('focusout', expect.any(Function));
  });
});
