import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PodiumModel } from '../components/ranking/PodiumModel';
const factory = vi.hoisted(() => vi.fn());
vi.mock('../components/ranking/podiumScene', () => ({ createPodiumScene: factory }));
const scene = () => ({ resize: vi.fn(), update: vi.fn(), dispose: vi.fn() });
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
    await waitFor(() => expect(container.querySelector('[data-renderer="webgl"]')).toBeInTheDocument());
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
});
