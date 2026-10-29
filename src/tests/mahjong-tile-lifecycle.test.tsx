import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MahjongTileMenu } from '../components/home/tiles/MahjongTileMenu';
import type { TileScene } from '../components/home/tiles/tileScene';

const factory = vi.hoisted(() => vi.fn());
vi.mock('../components/home/tiles/tileScene', () => ({ createTileScene: factory }));
beforeEach(() => {
  factory.mockReset();
  vi.stubGlobal('WebGL2RenderingContext', class {});
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const mockScene = (): TileScene => ({ render: vi.fn(), resize: vi.fn(), hit: vi.fn(() => false), dispose: vi.fn() });

describe('lazy scene lifecycle', () => {
  it('keeps controls usable when loading rejects', async () => {
    factory.mockRejectedValue(new Error('GPU unavailable'));
    const { container } = render(<MahjongTileMenu onOpen={vi.fn()} />);
    await waitFor(() => expect(container.querySelector('[data-renderer="fallback"]')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: '次のメニュー' }));
    expect(screen.getByRole('button', { name: '対局入力を開く' })).toBeInTheDocument();
  });
  it('disposes a scene that resolves after the component unmounts', async () => {
    let resolve!: (scene: TileScene) => void;
    factory.mockImplementation(() => new Promise<TileScene>(done => { resolve = done; }));
    const { unmount } = render(<MahjongTileMenu onOpen={vi.fn()} />);
    await waitFor(() => expect(factory).toHaveBeenCalledOnce());
    const signal = factory.mock.calls[0][2] as AbortSignal;
    unmount(); expect(signal.aborted).toBe(true);
    const scene = mockScene(); await act(async () => resolve(scene));
    expect(scene.dispose).toHaveBeenCalledOnce(); expect(scene.render).not.toHaveBeenCalled();
  });
  it('releases a ready scene on unmount', async () => {
    const scene = mockScene(); factory.mockResolvedValue(scene);
    const { container, unmount } = render(<MahjongTileMenu onOpen={vi.fn()} />);
    await waitFor(() => expect(container.querySelector('[data-renderer="webgl"]')).toBeInTheDocument());
    expect(container.querySelector('.jk-fallback')).toHaveAttribute('hidden');
    unmount(); expect(scene.dispose).toHaveBeenCalledOnce();
  });
  it('returns to the original-art fallback after context loss', async () => {
    const scene = mockScene(); factory.mockResolvedValue(scene);
    const { container } = render(<MahjongTileMenu onOpen={vi.fn()} />);
    await waitFor(() => expect(container.querySelector('[data-renderer="webgl"]')).toBeInTheDocument());
    act(() => factory.mock.calls[0][3]());
    expect(scene.dispose).toHaveBeenCalledOnce();
    expect(container.querySelector('.jk-fallback')).not.toHaveAttribute('hidden');
    fireEvent.click(screen.getByRole('button', { name: '04 段位' }));
    expect(screen.getByRole('button', { name: '段位を開く' })).toBeInTheDocument();
  });
});
