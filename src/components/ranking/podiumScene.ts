import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export interface PodiumScene {
  update: (name: string, place: number) => void; resize: () => void; dispose: () => void;
  flush: () => void;
}
export const medalColor = (place: number) => place === 1 ? 0xcdb780 : place === 2 ? 0xbac6d0 : 0xb68c71;

/** One real mesh scene for the featured player. Render only after content/size changes. */
export function createPodiumScene(host: HTMLDivElement, onLost: () => void): PodiumScene {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 30);
  const geometries: THREE.BufferGeometry[] = [], materials: THREE.Material[] = [], textures: THREE.Texture[] = [];
  let frame = 0, disposed = false, width = 0, height = 0, previous = '';
  const lost = (event: Event) => { event.preventDefault(); onLost(); };
  const dispose = () => {
    if (disposed) return; disposed = true; cancelAnimationFrame(frame);
    renderer.domElement.removeEventListener('webglcontextlost', lost);
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
    renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); scene.clear();
  };
  const flush = () => { cancelAnimationFrame(frame); frame = 0; if (!disposed) renderer.render(scene, camera); };
  const schedule = () => { if (!disposed && !frame) frame = requestAnimationFrame(() => { try { flush(); } catch { onLost(); } }); };
  try {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
    const viewDirection = new THREE.Vector3(1.1, .7, 5.6).normalize();
    camera.position.copy(viewDirection); camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x34423c, 2));
    const key = new THREE.DirectionalLight(0xffefd3, 4); key.position.set(-3, 5, 4); scene.add(key);
    const rim = new THREE.DirectionalLight(0xc9dce9, 2); rim.position.set(4, 2, -2); scene.add(rim);
    const ivory = new THREE.MeshStandardMaterial({ color: 0xf1ecdf, roughness: .25, metalness: .03 }); materials.push(ivory);
    const green = new THREE.MeshStandardMaterial({ color: 0x18573f, roughness: .32 }); materials.push(green);
    const metal = new THREE.MeshStandardMaterial({ color: medalColor(1), roughness: .3, metalness: .5 }); materials.push(metal);
    const dark = new THREE.MeshStandardMaterial({ color: 0x171d22, roughness: .45, metalness: .2 }); materials.push(dark);
    const tile = new THREE.Group(); tile.position.y = .4; tile.rotation.set(.02, -.1, -.04); scene.add(tile);
    const add = (geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D) => {
      geometries.push(geometry); const mesh = new THREE.Mesh(geometry, material); parent.add(mesh); return mesh;
    };
    add(new RoundedBoxGeometry(1.24, 1.8, .32, 4, .08), ivory, tile);
    add(new RoundedBoxGeometry(1.24, 1.8, .13, 4, .06), green, tile).position.z = -.19;
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 768;
    const context = canvas.getContext('2d'); if (!context) throw new Error('Podium texture unavailable');
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; textures.push(texture);
    const print = new THREE.MeshStandardMaterial({ map: texture, transparent: true, roughness: .42, depthWrite: false }); materials.push(print);
    add(new THREE.PlaneGeometry(1.08, 1.60), print, tile).position.z = .162;
    add(new THREE.CylinderGeometry(.64, .67, .10, 64), metal, scene).position.y = -.64;
    add(new THREE.CylinderGeometry(.68, .69, .07, 64), dark, scene).position.y = -.725;
    // The angle is fixed: fit the real mesh, not the much larger free-rotation sphere.
    // Keep 5% framing on every edge and preserve the ivory/green sides without clipping.
    scene.updateMatrixWorld(true);
    const viewPoints: THREE.Vector3[] = [];
    const inverseView = camera.quaternion.clone().invert();
    scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const vertices = object.geometry.getAttribute('position');
      for (let i = 0; i < vertices.count; i++) {
        viewPoints.push(new THREE.Vector3().fromBufferAttribute(vertices, i).applyMatrix4(object.matrixWorld).applyQuaternion(inverseView));
      }
    });
    const center = new THREE.Box3().setFromPoints(viewPoints).getCenter(new THREE.Vector3());
    const focus = center.clone().applyQuaternion(camera.quaternion);
    viewPoints.forEach(point => point.sub(center));
    const resize = () => {
      if (disposed) return;
      const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
      if (w === width && h === height) return;
      width = w; height = h; renderer.setSize(w, h, false); camera.aspect = w / h;
      const vertical = THREE.MathUtils.degToRad(camera.fov) / 2;
      const halfHeight = Math.tan(vertical) * .9, halfWidth = halfHeight * camera.aspect;
      let distance = 0;
      for (const point of viewPoints) distance = Math.max(distance, point.z + Math.max(Math.abs(point.x) / halfWidth, Math.abs(point.y) / halfHeight));
      camera.position.copy(viewDirection).multiplyScalar(distance).add(focus);
      camera.lookAt(focus); camera.far = distance + 10;
      camera.updateProjectionMatrix(); schedule();
    };
    const update = (name: string, place: number) => {
      if (disposed) return;
      const value = `${place}:${name}`;
      if (value !== previous) {
        previous = value;
        context.clearRect(0, 0, 512, 768); context.textAlign = 'center'; context.textBaseline = 'middle';
        context.fillStyle = '#24392f'; context.font = '600 280px "Hiragino Mincho ProN", "Yu Mincho", serif';
        context.fillText(Array.from(name)[0] ?? '雀', 256, 285, 410);
        context.font = '500 38px sans-serif'; context.fillText(name, 256, 445, 410);
        context.fillStyle = `#${medalColor(place).toString(16).padStart(6, '0')}`;
        context.fillRect(174, 500, 164, 3); context.font = '500 100px monospace';
        context.fillText(String(place).padStart(2, '0'), 256, 605);
        texture.needsUpdate = true; metal.color.setHex(medalColor(place));
      }
      schedule();
    };
    renderer.domElement.addEventListener('webglcontextlost', lost); host.appendChild(renderer.domElement); resize();
    return { resize, update, flush, dispose };
  } catch (error) { dispose(); throw error; }
}
