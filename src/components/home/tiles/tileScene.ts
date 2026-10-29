import * as THREE from 'three';
import { createEngravedTile, prepareArt } from './engravedTile';
import { TILE_MENUS } from './tileMenus';
import { tilePose } from './tileMotion';

export interface TileScene {
  render: (position: number, reduced: boolean, hx: number, hy: number) => void;
  resize: () => void;
  hit: (x: number, y: number, index: number) => boolean;
  dispose: () => void;
}

function loadImage(src: string, signal: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const cleanup = () => { clearTimeout(timer); image.onload = image.onerror = null; signal.removeEventListener('abort', abort); };
    const abort = () => { cleanup(); image.src = ''; reject(new Error('Tile image loading cancelled')); };
    const timer = setTimeout(abort, 15000);
    image.onload = () => { cleanup(); resolve(image); };
    image.onerror = () => { cleanup(); reject(new Error('Tile image unavailable')); };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort(); else image.src = src;
  });
}

export async function createTileScene(host: HTMLDivElement, stage: HTMLDivElement, signal: AbortSignal, onLost: () => void): Promise<TileScene> {
  const images = await Promise.all(TILE_MENUS.map(menu => loadImage(menu.source, signal)));
  if (signal.aborted) throw new Error('Tile scene cancelled');
  const arts = images.map((image, i) => prepareArt(image, TILE_MENUS[i].kind));
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
  const group = new THREE.Group();
  const tiles: ReturnType<typeof createEngravedTile>[] = [];
  let environment: THREE.WebGLRenderTarget | undefined;
  let disposed = false;
  const contextLost = (event: Event) => { event.preventDefault(); onLost(); };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    renderer.domElement.removeEventListener('webglcontextlost', contextLost);
    tiles.forEach(tile => {
      tile.geometries.forEach(item => item.dispose());
      tile.materials.forEach(item => item.dispose());
      tile.textures.forEach(item => item.dispose());
    });
    environment?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    scene.clear();
  };
  try {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x090d10, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    camera.position.set(0, 0, 8.8); camera.lookAt(0, 0, 0);
    scene.fog = new THREE.FogExp2(0x090d10, .022);
    const studio = new THREE.Scene(); studio.background = new THREE.Color(.055, .065, .075);
    const softboxes = [[5, 3, -3, 4, 5, 2.7], [2.2, 5, 4, 0, 3, 1.3], [4, .6, 0, -3, 4, .8]].map(([w, h, x, y, z, power]) => {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(power, power * .98, power * .92), side: THREE.DoubleSide }));
      panel.position.set(x, y, z); panel.lookAt(0, 0, 0); studio.add(panel); return panel;
    });
    const pmrem = new THREE.PMREMGenerator(renderer);
    try { environment = pmrem.fromScene(studio, .12, .1, 30); }
    finally { pmrem.dispose(); softboxes.forEach(panel => { panel.geometry.dispose(); panel.material.dispose(); }); }
    scene.environment = environment.texture; scene.environmentIntensity = .4;
    scene.add(new THREE.HemisphereLight(0xe9f0ff, 0x304537, .78));
    const key = new THREE.DirectionalLight(0xfff7e9, 3); key.position.set(-3.8, 5.2, 6.8); scene.add(key);
    const fill = new THREE.DirectionalLight(0xd3e0ee, .62); fill.position.set(5, -1, 3); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xd3b878, 1.35); rim.position.set(2.5, 3, -3); scene.add(rim);
    scene.add(group);
    arts.forEach(art => {
      const tile = createEngravedTile(art, renderer); tiles.push(tile); group.add(tile.group);
    });
    const base = tiles.map(tile => tile.materials.map(m => ({ color: m.color.clone(), env: m.envMapIntensity, specular: m.specularIntensity, clearcoat: m.clearcoat })));
    let mobile = false;
    const resize = () => {
      if (disposed) return;
      const w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight); mobile = w <= 560;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      const wh = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z, ww = wh * camera.aspect;
      group.position.set(mobile ? 0 : ww * .235, mobile ? wh * .15 : wh * .02, 0);
      group.scale.setScalar(mobile ? Math.min(.95, ww / 3.4) : 1.05);
    };
    const render: TileScene['render'] = (position, reduced, hx, hy) => {
      if (disposed) return;
      tiles.forEach((tile, i) => {
        const v = tilePose(i, position);
        tile.group.position.set(v.x, v.y, v.z); tile.group.scale.setScalar(v.scale);
        tile.group.rotation.set(reduced ? 0 : v.rx + hy * .10 * v.focus, reduced ? 0 : v.ry - (mobile ? .42 : 0) + hx * .18 * v.focus, reduced ? 0 : v.rz);
        tile.materials.forEach((m, j) => {
          const b = base[i][j];
          m.color.copy(b.color).multiplyScalar(v.light);
          m.envMapIntensity = b.env * v.light; m.specularIntensity = b.specular * v.light; m.clearcoat = b.clearcoat * v.light;
        });
      });
      renderer.render(scene, camera);
    };
    const raycaster = new THREE.Raycaster();
    const hit: TileScene['hit'] = (x, y, index) => {
      const box = stage.getBoundingClientRect();
      raycaster.setFromCamera(new THREE.Vector2((x - box.left) / box.width * 2 - 1, -(y - box.top) / box.height * 2 + 1), camera);
      const first = raycaster.intersectObjects(group.children, true)[0];
      return !!first && tiles[index].group.children.includes(first.object);
    };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    host.appendChild(renderer.domElement); resize();
    return { render, resize, hit, dispose };
  } catch (error) { dispose(); throw error; }
}
