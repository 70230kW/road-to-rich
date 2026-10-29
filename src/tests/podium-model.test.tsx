import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PodiumModel } from '../components/ranking/PodiumModel';
import { PodiumSpotlight } from '../components/ranking/PodiumSpotlight';
const factory = vi.hoisted(() => vi.fn());
vi.mock('../components/ranking/podiumScene', () => ({ createPodiumScene: factory }));
const scene = () => ({ resize: vi.fn(), update: vi.fn(), dispose: vi.fn(), rotate: vi.fn(), resetRotation: vi.fn(), flush: vi.fn() });
beforeEach(() => { factory.mockReset(); vi.stubGlobal('WebGL2RenderingContext', class {}); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('podium GPU lifecycle', () => {
  it('does not create a late scene after unmount', async () => {
    factory.mockReturnValue(scene());
    const { unmount } = render(<PodiumModel name="和賀" place={3} />); unmount();
    await act(async () => { await Promise.resolve(); });
    expect(factory).not.toHaveBeenCalled();
  });
  it('reuses one scene for player changes and disposes on unmount', async () => {
    const model = scene(); factory.mockReturnValue(model);
    const { rerender, unmount, container } = render(<PodiumModel name="和賀" place={3} />);
    expect(container.querySelector('[data-renderer="loading"]')).toBeInTheDocument();
    expect(container.querySelector('.podium-model-fallback')).not.toBeInTheDocument();
    await waitFor(() => expect(container.querySelector('[data-renderer="webgl"]')).toBeInTheDocument());
    expect(model.flush).toHaveBeenCalledOnce();
    expect(model.update).toHaveBeenLastCalledWith('和賀', 3);
    rerender(<PodiumModel name="佐野" place={1} />);
    expect(factory).toHaveBeenCalledOnce(); expect(model.update).toHaveBeenLastCalledWith('佐野', 1);
    unmount(); expect(model.dispose).toHaveBeenCalledOnce();
  });
  it('retains the original readable fallback on initialization or context failure', async () => {
    factory.mockImplementationOnce(() => { throw new Error('GPU'); });
    const first = render(<PodiumModel name="和賀" place={3} />);
    await waitFor(() => expect(factory).toHaveBeenCalledOnce());
    expect(first.container.querySelector('[data-renderer="fallback"]')).toHaveTextContent('和'); first.unmount();
    const model = scene(); factory.mockReturnValue(model);
    const second = render(<PodiumModel name="和賀" place={3} />);
    await waitFor(() => expect(second.container.querySelector('[data-renderer="webgl"]')).toBeInTheDocument());
    act(() => factory.mock.calls.at(-1)![1]());
    expect(model.dispose).toHaveBeenCalledOnce();
    expect(second.container.querySelector('[data-renderer="fallback"]')).toHaveTextContent('和');
  });
  it('does not initialize the GPU for an offscreen model', async () => {
    let intersection!: IntersectionObserverCallback;
    const disconnect = vi.fn();
    vi.stubGlobal('IntersectionObserver', class { constructor(cb: IntersectionObserverCallback) { intersection = cb; } observe() {} disconnect = disconnect; });
    const model = scene(); factory.mockReturnValue(model);
    const { unmount } = render(<PodiumModel name="和賀" place={3} />);
    expect(factory).not.toHaveBeenCalled();
    await act(async () => intersection([{ isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver));
    expect(factory).toHaveBeenCalledOnce();
    act(() => intersection([{ isIntersecting: false }] as IntersectionObserverEntry[], {} as IntersectionObserver));
    model.update.mockClear(); act(() => window.dispatchEvent(new Event('resize')));
    expect(model.update).not.toHaveBeenCalled();
    unmount(); expect(disconnect).toHaveBeenCalledOnce(); expect(model.dispose).toHaveBeenCalledOnce();
  });
  it('rotates in both axes without changing players, supports keyboard/reset, and stops on cancel', async () => {
    vi.stubGlobal('PointerEvent', class extends MouseEvent { pointerId = 1; isPrimary = true; });
    const models: ReturnType<typeof scene>[] = []; factory.mockImplementation(() => { const model = scene(); models.push(model); return model; });
    const open = vi.fn();
    render(<PodiumSpotlight entries={['和賀', '佐野', 'タカハシ'].map((name, i) => ({ id: name, name, place: i + 1, amount: '+100', amountLabel: null, positive: true, hanchanCount: 10 }))} onOpen={open} />);
    await waitFor(() => expect(factory).toHaveBeenCalledTimes(3));
    const rotation = screen.getByRole('group', { name: '和賀の3D麻雀牌' });
    Object.assign(rotation, { setPointerCapture: vi.fn() }); Object.defineProperty(rotation, 'clientWidth', { value: 150 });
    fireEvent.pointerDown(rotation, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(rotation, { clientX: 50, clientY: 140 });
    expect(models[0].rotate).toHaveBeenCalledExactlyOnceWith(-50 / 150 * Math.PI * 2, 40 / 150 * Math.PI * 2);
    fireEvent.pointerCancel(rotation); fireEvent.pointerMove(rotation, { clientX: 5, clientY: 5 });
    expect(models[0].rotate).toHaveBeenCalledOnce();
    expect(screen.getByRole('heading', { name: '和賀' })).toBeInTheDocument(); expect(open).not.toHaveBeenCalled();
    fireEvent.keyDown(rotation, { key: 'ArrowDown' }); expect(models[0].rotate).toHaveBeenLastCalledWith(0, .22);
    fireEvent.keyDown(rotation, { key: 'ArrowRight' }); expect(models[0].rotate).toHaveBeenLastCalledWith(.22, 0);
    expect(screen.getByRole('heading', { name: '和賀' })).toBeInTheDocument();
    fireEvent.keyDown(rotation, { key: 'Home' });
    fireEvent.click(screen.getByRole('button', { name: '和賀の牌を正面に戻す' }));
    expect(models[0].resetRotation).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('button', { name: '次の雀士' }));
    expect(screen.getByRole('heading', { name: '佐野' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '前の雀士' }));
    expect(factory).toHaveBeenCalledTimes(3); // retain each player's orientation across selection
    expect(models[0].resetRotation).toHaveBeenCalledTimes(2);
  });
  it('does not offer a nonfunctional rotation control when WebGL is unavailable', () => {
    vi.stubGlobal('WebGL2RenderingContext', undefined);
    const { container } = render(<PodiumModel name="和賀" place={3} />);
    expect(screen.getByText('麻雀牌プレビュー（静止画）')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /正面に戻す/ })).not.toBeInTheDocument();
    expect(container.querySelector('.podium-model-rotation')).toHaveAttribute('tabindex', '-1');
    expect(factory).not.toHaveBeenCalled();
  });
  it('shows the fallback, not a ready scene, when the first frame cannot render', async () => {
    const model = scene(); model.flush.mockImplementation(() => { throw new Error('First frame failed'); });
    factory.mockReturnValue(model);
    const { container } = render(<PodiumModel name="和賀" place={3} />);
    await waitFor(() => expect(container.querySelector('[data-renderer="fallback"]')).toBeInTheDocument());
    expect(model.dispose).toHaveBeenCalledOnce();
    expect(container.querySelector('.podium-model-fallback')).toBeInTheDocument();
  });
});
