import { afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createTileTitle, createTileTitles } from '../components/home/tiles/tileTitle';
import { FALLBACK_TITLE_LAYER, MINCHO_FONT, TITLE_DEPTH, tileComposition, tileLayout, titleFrame, titleLines } from '../components/home/tiles/tileTypography';
import { tilePose } from '../components/home/tiles/tileMotion';
import { createEngravedTile } from '../components/home/tiles/engravedTile';

afterEach(() => vi.restoreAllMocks());
function mockCanvas() {
  const context = { font: '', measureText: (s: string) => ({ width: s.length * 320 }), fillText: vi.fn(),
    createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData: vi.fn() };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  return context;
}

describe('Mincho title between the foreground and rear tiles', () => {
  it('rasterizes the original Japanese text in Mincho once and enables real depth testing', () => {
    const context = mockCanvas();
    const title = createTileTitle('順位表');
    expect(context.font).toContain(MINCHO_FONT);
    expect(context.fillText).toHaveBeenCalledExactlyOnceWith('順位表', 2048 * .02, expect.any(Number));
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
        expect(mesh.scale.y).toBeLessThanOrEqual(worldHeight * tileLayout(w, h).title.height + 1e-10);
      });
    }
    expect(tilePose(0, 0).z).toBeGreaterThan(TITLE_DEPTH);
    expect(tilePose(1, 0).z).toBeLessThan(TITLE_DEPTH);
    expect(tilePose(2, 0).z).toBeLessThan(TITLE_DEPTH);
    expect(100 * (1 - tilePose(0, 0).depth)).toBeGreaterThan(FALLBACK_TITLE_LAYER);
    expect(100 * (1 - tilePose(1, 0).depth)).toBeLessThan(FALLBACK_TITLE_LAYER);
    for (let p = -8; p < 8; p += .125) titles.render(p, false);
    expect(context.fillText).toHaveBeenCalledTimes(6); // Six lines, no per-frame text upload.
    const disposals = scene.children.map(child => vi.spyOn((child as THREE.Mesh).geometry, 'dispose'));
    titles.dispose(); titles.dispose();
    expect(scene.children).toHaveLength(0); disposals.forEach(spy => expect(spy).toHaveBeenCalledOnce());
  });

  it('breaks long names at word boundaries instead of concealing their middle characters', () => {
    const context = mockCanvas();
    expect(titleLines('対局入力')).toEqual(['対局', '入力']);
    expect(titleLines('ダッシュボード')).toEqual(['ダッシュ', 'ボード']);
    expect(titleLines('順位表')).toEqual(['順位表']);
    const title = createTileTitle('対局入力');
    expect(context.fillText.mock.calls.map(call => call[0])).toEqual(['対局', '入力']);
    expect(context.fillText.mock.calls[1][2]).toBeGreaterThan(context.fillText.mock.calls[0][2]);
    title.dispose();
  });

  it('keeps the entire reading zone clear of the projected real foreground mesh at rest', () => {
    mockCanvas();
    const tile = createEngravedTile({ albedo: document.createElement('canvas'), mask: new Float32Array(64 * 96), width: 64, height: 96, sourceCrop: [0, 0, 64, 96] });
    const group = new THREE.Group(); group.add(tile.group);
    const camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
    camera.position.z = 8.8; camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
    for (const [w, h] of [[320, 280], [320, 450], [390, 500], [440, 555], [768, 680], [1024, 500], [844, 160]]) {
      camera.aspect = w / h; camera.updateProjectionMatrix();
      const composition = tileComposition(w, h);
      group.scale.setScalar(composition.scale); group.position.set(composition.x, composition.y, 0);
      const pose = tilePose(0, 0), area = composition.layout.title;
      tile.group.position.set(pose.x, pose.y, pose.z); tile.group.scale.setScalar(pose.scale);
      for (const reduced of [false, true]) for (const hover of [-.5, 0, .5]) {
        tile.group.rotation.set(reduced ? 0 : pose.rx + hover * .1, reduced ? 0 : pose.ry - (w <= 560 ? .42 : 0) + hover * .18, reduced ? 0 : pose.rz);
        group.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(group);
        const points: THREE.Vector3[] = [];
        for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) points.push(new THREE.Vector3(x, y, z).project(camera));
        const left = (Math.min(...points.map(p => p.x)) + 1) / 2, right = (Math.max(...points.map(p => p.x)) + 1) / 2;
        const top = (1 - Math.max(...points.map(p => p.y))) / 2, bottom = (1 - Math.min(...points.map(p => p.y))) / 2;
        const overlapX = Math.max(0, Math.min(right, area.left + area.width) - Math.max(left, area.left));
        const overlapY = Math.max(0, Math.min(bottom, area.top + area.height) - Math.max(top, area.top));
        expect(overlapX * overlapY, `${w}×${h}, reduced=${reduced}, hover=${hover}`).toBe(0);
        expect(left).toBeGreaterThan(0); expect(right).toBeLessThan(1);
        expect(top).toBeGreaterThan(0); expect(bottom).toBeLessThan(1);
      }
    }
    tile.geometries.forEach(g => g.dispose()); tile.materials.forEach(m => m.dispose()); tile.textures.forEach(t => t.dispose());
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
