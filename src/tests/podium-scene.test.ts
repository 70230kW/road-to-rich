import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createPodiumScene, medalColor } from '../components/ranking/podiumScene';

const calls = vi.hoisted(() => ({ render: vi.fn(), dispose: vi.fn(), forceContextLoss: vi.fn() }));
vi.mock('three', async importOriginal => ({
  ...await importOriginal<typeof import('three')>(),
  WebGLRenderer: class {
    domElement = document.createElement('canvas');
    setPixelRatio() {} setClearColor() {} setSize() {}
    render = calls.render; dispose = calls.dispose; forceContextLoss = calls.forceContextLoss;
  },
}));
let drawText = vi.fn();
beforeEach(() => {
  Object.values(calls).forEach(mock => mock.mockClear()); drawText = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ clearRect: vi.fn(), fillRect: vi.fn(), fillText: drawText } as unknown as CanvasRenderingContext2D);
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());
describe('podium real mesh with a mocked GPU boundary', () => {
  it('coalesces frames, draws only after changes, fits the camera, and frees GPU resources', () => {
    const host = document.createElement('div');
    Object.defineProperties(host, { clientWidth: { value: 280, configurable: true }, clientHeight: { value: 245, configurable: true } });
    const model = createPodiumScene(host, vi.fn());
    model.update('和賀', 3); model.update('和賀', 3);
    expect(drawText).toHaveBeenCalledTimes(3);
    expect(requestAnimationFrame).toHaveBeenCalledOnce();
    const scheduled = vi.mocked(requestAnimationFrame).mock.calls[0][0]; scheduled(0);
    expect(calls.render).toHaveBeenCalledOnce(); expect(requestAnimationFrame).toHaveBeenCalledOnce();
    const [scene, camera] = calls.render.mock.calls[0] as [THREE.Scene, THREE.PerspectiveCamera];
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
    const meshes: THREE.Mesh[] = []; scene.traverse(object => { if (object instanceof THREE.Mesh) meshes.push(object); });
    expect(meshes).toHaveLength(5);
    expect(meshes.filter(mesh => mesh.geometry.type === 'RoundedBoxGeometry')).toHaveLength(2);
    const checkBounds = () => {
      scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
      let extent = 0;
      for (const mesh of meshes) {
        const vertices = mesh.geometry.getAttribute('position');
        let maxX = 0, maxY = 0;
        for (let i = 0; i < vertices.count; i++) {
          const point = new THREE.Vector3().fromBufferAttribute(vertices, i).applyMatrix4(mesh.matrixWorld).project(camera);
          maxX = Math.max(maxX, Math.abs(point.x)); maxY = Math.max(maxY, Math.abs(point.y));
        }
        expect(maxX).toBeLessThanOrEqual(.901); expect(maxY).toBeLessThanOrEqual(.901);
        extent = Math.max(extent, maxX, maxY);
      }
      // Close framing: one axis fills 90% of the canvas, while every vertex is safe.
      expect(extent).toBeCloseTo(.9, 5);
    };
    checkBounds();
    const tile = meshes[0].parent!; const initial = tile.quaternion.clone();
    // Model columns at ~320 / 390 / 768 / 1024px screen sizes, plus a wide short host.
    for (const [w, h] of [[159, 320], [198, 320], [390, 475], [531, 510], [470, 310]]) {
      Object.defineProperties(host, { clientWidth: { value: w, configurable: true }, clientHeight: { value: h, configurable: true } }); model.resize(); checkBounds();
      const vertices = meshes[0].geometry.getAttribute('position');
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let i = 0; i < vertices.count; i++) {
        const point = new THREE.Vector3().fromBufferAttribute(vertices, i).applyMatrix4(meshes[0].matrixWorld).project(camera);
        minX = Math.min(minX, point.x); maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y); maxY = Math.max(maxY, point.y);
      }
      // Narrow phones fill at least 75% of the column with the tile itself.
      // Wide hosts are height-constrained; keep at least 65% height for the tile.
      expect(Math.max((maxX - minX) / 2, (maxY - minY) / 2), `${w}×${h}`).toBeGreaterThan(w / h < .7 ? .75 : .65);
      expect(tile.quaternion.equals(initial)).toBe(true);
    }
    expect(model).not.toHaveProperty('rotate'); expect(model).not.toHaveProperty('resetRotation');
    const geometries = meshes.map(mesh => vi.spyOn(mesh.geometry, 'dispose'));
    const materials = [...new Set(meshes.map(mesh => mesh.material as THREE.Material))].map(material => vi.spyOn(material, 'dispose'));
    const texture = meshes.map(mesh => (mesh.material as THREE.MeshStandardMaterial).map).find(Boolean)!;
    const disposeTexture = vi.spyOn(texture, 'dispose');
    model.dispose(); model.dispose();
    geometries.forEach(spy => expect(spy).toHaveBeenCalledOnce()); materials.forEach(spy => expect(spy).toHaveBeenCalledOnce());
    expect(disposeTexture).toHaveBeenCalledOnce(); expect(calls.dispose).toHaveBeenCalledOnce();
    expect(cancelAnimationFrame).toHaveBeenCalled(); expect(host.children).toHaveLength(0);
  });
  it('uses actual tied ranks for medal colors', () => {
    expect(medalColor(1)).toBe(0xcdb780); expect(medalColor(2)).toBe(0xbac6d0); expect(medalColor(3)).toBe(0xb68c71);
  });
});
