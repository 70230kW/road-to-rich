import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export interface PodiumScene {
  update: (name: string, place: number) => void; resize: () => void; dispose: () => void;
  rotate: (yaw: number, pitch: number) => void; resetRotation: () => void;
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
    camera.position.set(2.2, 1.35, 5.2); camera.lookAt(0, .05, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x34423c, 2));
    const key = new THREE.DirectionalLight(0xffefd3, 4); key.position.set(-3, 5, 4); scene.add(key);
    const rim = new THREE.DirectionalLight(0xc9dce9, 2); rim.position.set(4, 2, -2); scene.add(rim);
    const ivory = new THREE.MeshStandardMaterial({ color: 0xf1ecdf, roughness: .25, metalness: .03 }); materials.push(ivory);
    const green = new THREE.MeshStandardMaterial({ color: 0x18573f, roughness: .32 }); materials.push(green);
    const metal = new THREE.MeshStandardMaterial({ color: medalColor(1), roughness: .3, metalness: .5 }); materials.push(metal);
    const dark = new THREE.MeshStandardMaterial({ color: 0x171d22, roughness: .45, metalness: .2 }); materials.push(dark);
    const tile = new THREE.Group(); tile.position.y = .4; tile.rotation.set(0, -.3, -.045); scene.add(tile);
    const initialRotation = tile.quaternion.clone();
    const rotationAxis = new THREE.Vector3(), rotation = new THREE.Quaternion();
    const rotate = (yaw: number, pitch: number) => {
      if (disposed || !Number.isFinite(yaw) || !Number.isFinite(pitch) || (!yaw && !pitch)) return;
      // Camera-relative quaternion rotations have no polar limit or Euler/gimbal lock.
      rotationAxis.set(pitch, yaw, 0).normalize().applyQuaternion(camera.quaternion);
      rotation.setFromAxisAngle(rotationAxis, Math.hypot(yaw, pitch));
      tile.quaternion.premultiply(rotation).normalize(); schedule();
    };
    const resetRotation = () => { if (!disposed) { tile.quaternion.copy(initialRotation); schedule(); } };
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
    add(new THREE.CylinderGeometry(.81, .86, .15, 64), metal, scene).position.y = -.90;
    add(new THREE.CylinderGeometry(.9, .94, .09, 64), dark, scene).position.y = -1.02;
    const resize = () => {
      if (disposed) return;
      const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
      if (w === width && h === height) return;
      width = w; height = h; renderer.setSize(w, h, false); camera.aspect = w / h;
      // Fit a rotation-safe bounding sphere, including mobile's half-width column.
      const vertical = THREE.MathUtils.degToRad(camera.fov) / 2;
      const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
      const distance = 1.6 / Math.sin(Math.min(vertical, horizontal));
      camera.position.set(2.2, 1.35, 5.2).normalize().multiplyScalar(distance).add(new THREE.Vector3(0, .12, 0));
      camera.lookAt(0, .12, 0); camera.far = distance + 10;
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
    return { resize, update, rotate, resetRotation, flush, dispose };
  } catch (error) { dispose(); throw error; }
}
