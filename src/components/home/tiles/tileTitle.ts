import * as THREE from 'three';
import { TILE_MENUS } from './tileMenus';
import { MINCHO_FONT, TITLE_DEPTH, tileLayout, titleFrame, titleLines } from './tileTypography';

/** Text shares the tiles' depth buffer, so only geometry in front occludes it. */
export function createTileTitle(name: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Title canvas unavailable');
  context.font = `400 320px ${MINCHO_FONT}`;
  const lines = titleLines(name);
  const measured = Math.max(...lines.map(line => context.measureText(line).width));
  const fontSize = Math.min(900, 320 * canvas.width * .96 / Math.max(1, measured));
  canvas.height = Math.ceil(fontSize * (lines.length * 1.12 + .24));
  context.font = `400 ${fontSize}px ${MINCHO_FONT}`;
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  context.fillStyle = '#f3f0e7';
  lines.forEach((line, index) => context.fillText(line, canvas.width * .02, fontSize * (.68 + index * 1.12)));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthTest: true, depthWrite: false, toneMapped: false, fog: false });
  const geometry = new THREE.PlaneGeometry(1, 1);
  const mesh = new THREE.Mesh(geometry, material);
  // Draw after opaque tiles; the existing depth buffer performs the masking.
  mesh.renderOrder = 1;
  return { mesh, ratio: canvas.height / canvas.width, dispose: () => { geometry.dispose(); material.dispose(); texture.dispose(); } };
}

export function createTileTitles(scene: THREE.Scene) {
  const titles: ReturnType<typeof createTileTitle>[] = [];
  let width = 1, disposed = false;
  const origins: number[] = [];
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    titles.forEach(title => { scene.remove(title.mesh); title.dispose(); });
  };
  try {
    TILE_MENUS.forEach(menu => { const title = createTileTitle(menu.name); titles.push(title); scene.add(title.mesh); });
  } catch (error) { dispose(); throw error; }
  return {
    resize(camera: THREE.PerspectiveCamera, tileScale: number) {
      const z = TITLE_DEPTH * tileScale;
      const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - z);
      width = height * camera.aspect;
      const area = tileLayout(camera.aspect, 1).title;
      titles.forEach((title, index) => {
        const w = Math.min(width * area.width, height * area.height / title.ratio);
        const x = width * (area.left - .5) + w / 2;
        origins[index] = x;
        title.mesh.scale.set(w, w * title.ratio, 1);
        title.mesh.position.set(x, height * (.5 - area.top) - w * title.ratio / 2, z);
      });
    },
    render(position: number, reduced: boolean) {
      titles.forEach((title, index) => {
        const frame = titleFrame(index, position, reduced);
        title.mesh.material.opacity = frame.opacity;
        title.mesh.position.x = (origins[index] ?? 0) + width * frame.offset;
        title.mesh.visible = frame.opacity > 0;
      });
    },
    dispose,
  };
}
