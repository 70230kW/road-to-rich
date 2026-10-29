import { afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createTileTitle, createTileTitles } from '../components/home/tiles/tileTitle';
import { FALLBACK_TITLE_LAYER, MINCHO_FONT, TITLE_DEPTH, titleFrame } from '../components/home/tiles/tileTypography';
import { tilePose } from '../components/home/tiles/tileMotion';

afterEach(() => vi.restoreAllMocks());
function mockCanvas() {
  const context = { font: '', measureText: (s: string) => ({ width: s.length * 320 }), fillText: vi.fn() };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  return context;
}

describe('Mincho title between the foreground and rear tiles', () => {
  it('rasterizes the original Japanese text in Mincho once and enables real depth testing', () => {
    const context = mockCanvas();
    const title = createTileTitle('順位表');
    expect(context.font).toContain(MINCHO_FONT);
    expect(context.fillText).toHaveBeenCalledExactlyOnceWith('順位表', 1024, expect.any(Number));
    expect(title.mesh.material.depthTest).toBe(true);
    expect(title.mesh.material.depthWrite).toBe(false);
    expect(title.mesh.material.transparent).toBe(true);
    expect(title.mesh.material.toneMapped).toBe(false);
    const textureDispose = vi.spyOn(title.mesh.material.map!, 'dispose');
    const geometryDispose = vi.spyOn(title.mesh.geometry, 'dispose');
    const materialDispose = vi.spyOn(title.mesh.material, 'dispose');
    title.dispose();
    expect(textureDispose).toHaveBeenCalledOnce(); expect(geometryDispose).toHaveBeenCalledOnce(); expect(materialDispose).toHaveBeenCalledOnce();
  });

  it('fits different viewport shapes, lies between tile depths and releases all resources', () => {
    const context = mockCanvas(), scene = new THREE.Scene();
    const titles = createTileTitles(scene);
    const camera = new THREE.PerspectiveCamera(30, 1, .1, 100); camera.position.z = 8.8;
    for (const [w, h] of [[320, 240], [390, 500], [768, 650], [1024, 500], [844, 160]]) {
      camera.aspect = w / h;
      titles.resize(camera, .8);
      const worldHeight = 2 * Math.tan(Math.PI / 12) * (8.8 - TITLE_DEPTH * .8);
      scene.children.forEach(mesh => {
        expect(mesh.position.z).toBe(TITLE_DEPTH * .8);
        expect(mesh.scale.x).toBeLessThanOrEqual(worldHeight * camera.aspect);
        expect(mesh.scale.y).toBeLessThanOrEqual(worldHeight * .65 + 1e-10);
      });
    }
    expect(tilePose(0, 0).z).toBeGreaterThan(TITLE_DEPTH);
    expect(tilePose(1, 0).z).toBeLessThan(TITLE_DEPTH);
    expect(tilePose(2, 0).z).toBeLessThan(TITLE_DEPTH);
    expect(100 * (1 - tilePose(0, 0).depth)).toBeGreaterThan(FALLBACK_TITLE_LAYER);
    expect(100 * (1 - tilePose(1, 0).depth)).toBeLessThan(FALLBACK_TITLE_LAYER);
    for (let p = -8; p < 8; p += .125) titles.render(p, false);
    expect(context.fillText).toHaveBeenCalledTimes(4); // No per-frame text upload.
    const disposals = scene.children.map(child => vi.spyOn((child as THREE.Mesh).geometry, 'dispose'));
    titles.dispose(); titles.dispose();
    expect(scene.children).toHaveLength(0); disposals.forEach(spy => expect(spy).toHaveBeenCalledOnce());
  });

  it('crossfades continuously through loops, reversals and reduced motion', () => {
    for (let p = -12; p <= 12; p += .125) for (let i = 0; i < 4; i++) {
      expect(titleFrame(i, p, false)).toEqual(titleFrame(i, p + 4, false));
      expect(Math.abs(titleFrame(i, p, false).opacity - titleFrame(i, p + .00001, false).opacity)).toBeLessThan(.0001);
      expect(titleFrame(i, p, true).offset).toBe(0);
    }
  });

  it('cleans up earlier titles if canvas initialization fails halfway', () => {
    const context = { measureText: () => ({ width: 960 }), fillText: vi.fn() } as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValueOnce(context).mockReturnValue(null);
    const geometryDispose = vi.spyOn(THREE.PlaneGeometry.prototype, 'dispose');
    const textureDispose = vi.spyOn(THREE.CanvasTexture.prototype, 'dispose');
    const scene = new THREE.Scene();
    expect(() => createTileTitles(scene)).toThrow('Title canvas unavailable');
    expect(scene.children).toHaveLength(0);
    expect(geometryDispose).toHaveBeenCalledOnce(); expect(textureDispose).toHaveBeenCalledOnce();
  });
});
