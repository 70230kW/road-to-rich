import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEngravedTile } from '../components/home/tiles/engravedTile';
afterEach(() => vi.restoreAllMocks());

describe('prototype engraving geometry', () => {
  it('uses real recessed vertices, a joined perimeter and a single normal-map slope', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({
      createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
      putImageData: vi.fn(),
    }) as unknown as CanvasRenderingContext2D);
    const width = 64, height = 96, mask = new Float32Array(width * height);
    for (let y = 20; y < 76; y++) for (let x = 20; x < 44; x++) mask[y * width + x] = 1;
    const tile = createEngravedTile({ albedo: document.createElement('canvas'), mask, width, height, sourceCrop: [0, 0, width, height] });
    const face = tile.geometries[2];
    const position = face.getAttribute('position'), normal = face.getAttribute('normal');
    const { frontZ, gridX, gridY } = tile.group.userData.engraving;
    expect(tile.depth).toBe(.014);
    expect(position.count).toBe(161 * 241);
    let minimum = frontZ;
    for (let j = 0; j <= gridY; j++) for (let i = 0; i <= gridX; i++) {
      const index = j * (gridX + 1) + i;
      const z = position.getZ(index); minimum = Math.min(z, minimum);
      if (i === 0 || j === 0 || i === gridX || j === gridY) expect(z).toBeCloseTo(frontZ, 6);
      expect(normal.getX(index)).toBe(0); expect(normal.getY(index)).toBe(0); expect(normal.getZ(index)).toBe(1);
    }
    expect(frontZ - minimum).toBeCloseTo(.014, 6);
    expect(tile.materials[1].color.getHex()).toBe(0x155b41);
    expect(tile.materials[2].normalScale.toArray()).toEqual([1, 1]);
    tile.geometries.forEach(g => g.dispose()); tile.materials.forEach(m => m.dispose()); tile.textures.forEach(t => t.dispose());
  });
});
