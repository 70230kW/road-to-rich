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
      for (const mesh of meshes) {
        const vertices = mesh.geometry.getAttribute('position');
        let maxX = 0, maxY = 0;
        for (let i = 0; i < vertices.count; i++) {
          const point = new THREE.Vector3().fromBufferAttribute(vertices, i).applyMatrix4(mesh.matrixWorld).project(camera);
          maxX = Math.max(maxX, Math.abs(point.x)); maxY = Math.max(maxY, Math.abs(point.y));
        }
        expect(maxX).toBeLessThan(1); expect(maxY).toBeLessThan(1);
      }
    };
    checkBounds();
    const tile = meshes[0].parent!; const initial = tile.quaternion.clone();
    for (const [w, h] of [[132, 210], [163, 210], [340, 310], [470, 310]]) {
      Object.defineProperties(host, { clientWidth: { value: w, configurable: true }, clientHeight: { value: h, configurable: true } }); model.resize(); checkBounds();
      for (let step = 0; step < 12; step++) { model.rotate(.7, .4); checkBounds(); }
    }
    expect(tile.quaternion.equals(initial)).toBe(false);
    expect(tile.quaternion.length()).toBeCloseTo(1, 10);
    model.resetRotation(); expect(tile.quaternion.equals(initial)).toBe(true);
    model.rotate(Math.PI * 4, 0); expect(Math.abs(tile.quaternion.dot(initial))).toBeCloseTo(1, 10);
    model.rotate(0, Math.PI * 4); expect(Math.abs(tile.quaternion.dot(initial))).toBeCloseTo(1, 10);
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
