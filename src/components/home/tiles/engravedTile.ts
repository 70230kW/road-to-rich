import * as THREE from 'three';
import { clamp } from './tileMotion';

// Ported from the approved prototype. Preserve the art mask, shared perimeter,
// 0.014 recess and flat normals: the normal map supplies the slope only once.
    function makeCanvas(width: number,height: number){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;return canvas;}
    export function prepareArt(image: HTMLImageElement,kind: string){
      const source=makeCanvas(image.naturalWidth,image.naturalHeight),ctx=source.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(image,0,0);
      const sw=source.width,sh=source.height,sourcePixels=ctx.getImageData(0,0,sw,sh),data=sourcePixels.data;
      const clean=makeCanvas(sw,sh),cleanCtx=clean.getContext('2d')!,cleanPixels=cleanCtx.createImageData(sw,sh);
      let minX=sw,minY=sh,maxX=0,maxY=0;
      for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){
        const at=(y*sw+x)*4,r=data[at],g=data[at+1],b=data[at+2],alpha=data[at+3]/255;
        const coverage=alpha*(kind==='red'?clamp((r-Math.max(g,b)-10)/60,0,1):clamp(((kind==='bird'?255:245)-Math.min(r,g,b))/48,0,1));
        cleanPixels.data[at]=r;cleanPixels.data[at+1]=g;cleanPixels.data[at+2]=b;cleanPixels.data[at+3]=Math.round(coverage*255);
        if(coverage>.04){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
      }
      cleanCtx.putImageData(cleanPixels,0,0);
      const width=512,height=768,bw=maxX-minX+1,bh=maxY-minY+1,padW=kind==='bird'?.9:.86;
      const scale=Math.min(width*padW/bw,height*.88/bh),dw=bw*scale,dh=bh*scale,dx=(width-dw)/2,dy=(height-dh)/2;
      const albedo=makeCanvas(width,height),ac=albedo.getContext('2d')!;ac.fillStyle='rgb(244,241,230)';ac.fillRect(0,0,width,height);ac.imageSmoothingQuality='high';ac.drawImage(clean,minX,minY,bw,bh,dx,dy,dw,dh);
      const maskCanvas=makeCanvas(width,height),mc=maskCanvas.getContext('2d',{willReadFrequently:true})!;mc.imageSmoothingQuality='high';mc.drawImage(clean,minX,minY,bw,bh,dx,dy,dw,dh);
      const maskPixels=mc.getImageData(0,0,width,height).data,raw=new Float32Array(width*height),temp=new Float32Array(width*height),mask=new Float32Array(width*height);
      for(let n=0;n<raw.length;n++)raw[n]=maskPixels[n*4+3]/255;
      for(let y=0;y<height;y++)for(let x=0;x<width;x++){const n=y*width+x;temp[n]=(raw[y*width+Math.max(0,x-1)]+2*raw[n]+raw[y*width+Math.min(width-1,x+1)])/4;}
      for(let y=0;y<height;y++)for(let x=0;x<width;x++){const n=y*width+x;mask[n]=(temp[Math.max(0,y-1)*width+x]+2*temp[n]+temp[Math.min(height-1,y+1)*width+x])/4;}
      return {albedo,mask,width,height,sourceCrop:[minX,minY,bw,bh]};
    }

    export function createEngravedTile(art: ReturnType<typeof prepareArt>, renderer?: THREE.WebGLRenderer) {
  const W = 1.34;
  const H = 1.98;
  const R = 0.09;
  const NX = 160;
  const NY = 240;
  const depth = 0.014;
  const width = art.width;
  const height = art.height;
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
  const smoothstep = (value: number) => {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  };
  if (!art.albedo || !art.mask || width < 2 || height < 2 || art.mask.length !== width * height) {
    throw new Error('createEngravedTile requires an albedo canvas and a matching ink mask.');
  }
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.MeshPhysicalMaterial[] = [];
  const textures: THREE.Texture[] = [];
  try {

  // The body contour and the front grid share exactly the same edge vertices.
  const rows = Array.from({ length: NY + 1 }, (_, j) => {
    const y = -H / 2 + H * j / NY;
    const cornerY = Math.max(0, Math.abs(y) - (H / 2 - R));
    const halfWidth = cornerY > 0
      ? W / 2 - R + Math.sqrt(Math.max(0, R * R - cornerY * cornerY))
      : W / 2;
    return { y, halfWidth };
  });
  const outline = new THREE.Shape();
  outline.moveTo(-rows[0].halfWidth, rows[0].y);
  for (let i = 1; i <= NX; i++) outline.lineTo(rows[0].halfWidth * (2 * i / NX - 1), rows[0].y);
  for (let j = 1; j <= NY; j++) outline.lineTo(rows[j].halfWidth, rows[j].y);
  for (let i = NX - 1; i >= 0; i--) outline.lineTo(rows[NY].halfWidth * (2 * i / NX - 1), rows[NY].y);
  for (let j = NY - 1; j > 0; j--) outline.lineTo(-rows[j].halfWidth, rows[j].y);
  outline.closePath();

  const closedBody = new THREE.ExtrudeGeometry(outline, {
    depth: 0.62,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 5,
    bevelSize: 0.065,
    bevelThickness: 0.065,
    curveSegments: 12
  });
  closedBody.translate(0, 0, -0.31);
  closedBody.computeBoundingBox();
  const frontZ = closedBody.boundingBox!.max.z;

  // Remove the positive-Z cap, preserving its surrounding bevel and side wall.
  const sourcePositions = closedBody.getAttribute('position');
  const sourceIndex = closedBody.getIndex();
  const sourceCount = sourceIndex ? sourceIndex.count : sourcePositions.count;
  const keep = [];
  for (let i = 0; i < sourceCount; i += 3) {
    const a = sourceIndex ? sourceIndex.getX(i) : i;
    const b = sourceIndex ? sourceIndex.getX(i + 1) : i + 1;
    const c = sourceIndex ? sourceIndex.getX(i + 2) : i + 2;
    const isFrontCap = [a, b, c].every((v) => Math.abs(sourcePositions.getZ(v) - frontZ) < 1e-6);
    if (!isFrontCap) keep.push(a, b, c);
  }
  const bodyGeometry = new THREE.BufferGeometry();
  for (const [name, attribute] of Object.entries(closedBody.attributes)) {
    const values = new Float32Array(keep.length * attribute.itemSize);
    for (let i = 0; i < keep.length; i++) {
      for (let c = 0; c < attribute.itemSize; c++) {
        values[i * attribute.itemSize + c] = attribute.array[keep[i] * attribute.itemSize + c];
      }
    }
    bodyGeometry.setAttribute(name, new THREE.BufferAttribute(values, attribute.itemSize, attribute.normalized));
  }
  bodyGeometry.computeBoundingBox();
  bodyGeometry.computeBoundingSphere();
  closedBody.dispose();
  geometries.push(bodyGeometry);

  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xf4f1e6,
    roughness: 0.29,
    metalness: 0,
    clearcoat: 0.12,
    clearcoatRoughness: 0.31
  });
  materials.push(bodyMaterial);
  group.add(new THREE.Mesh(bodyGeometry, bodyMaterial));

  // A separate green rear layer extends overall thickness to about 0.90.
  const backGeometry = new THREE.ExtrudeGeometry(outline, {
    depth: 0.19,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: 0.045,
    bevelThickness: 0.035,
    curveSegments: 12
  });
  backGeometry.translate(0, 0, -0.49);
  geometries.push(backGeometry);
  const backMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x155b41,
    roughness: 0.32,
    metalness: 0,
    clearcoat: 0.18,
    clearcoatRoughness: 0.3
  });
  materials.push(backMaterial);
  group.add(new THREE.Mesh(backGeometry, backMaterial));

  // A small separable blur rounds the engraved edge while keeping albedo intact.
  const kernel = [1, 4, 6, 4, 1];
  const horizontal = new Float32Array(width * height);
  const ink = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -2; k <= 2; k++) {
        sum += clamp(art.mask[y * width + clamp(x + k, 0, width - 1)], 0, 1) * kernel[k + 2];
      }
      horizontal[y * width + x] = sum / 16;
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -2; k <= 2; k++) sum += horizontal[clamp(y + k, 0, height - 1) * width + x] * kernel[k + 2];
      const px = (x / (width - 1) - 0.5) * W;
      const py = (0.5 - y / (height - 1)) * H;
      const qx = Math.abs(px) - (W / 2 - R);
      const qy = Math.abs(py) - (H / 2 - R);
      const signedDistance = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - R;
      // A clean perimeter guarantees that the front joins the existing bevel.
      ink[y * width + x] = sum / 16 * smoothstep(-signedDistance / 0.018);
    }
  }
  function sampleInk(u: number, v: number) {
    const px = clamp(u, 0, 1) * (width - 1);
    const py = (1 - clamp(v, 0, 1)) * (height - 1);
    const x0 = Math.floor(px), y0 = Math.floor(py);
    const x1 = Math.min(x0 + 1, width - 1), y1 = Math.min(y0 + 1, height - 1);
    const tx = px - x0, ty = py - y0;
    const top = ink[y0 * width + x0] * (1 - tx) + ink[y0 * width + x1] * tx;
    const bottom = ink[y1 * width + x0] * (1 - tx) + ink[y1 * width + x1] * tx;
    return top * (1 - ty) + bottom * ty;
  }

  const position = new Float32Array((NX + 1) * (NY + 1) * 3);
  const normal = new Float32Array(position.length);
  const uv = new Float32Array((NX + 1) * (NY + 1) * 2);
  const indices = new Uint16Array(NX * NY * 6);
  for (let j = 0; j <= NY; j++) {
    for (let i = 0; i <= NX; i++) {
      const vertex = j * (NX + 1) + i;
      const x = rows[j].halfWidth * (2 * i / NX - 1);
      const y = rows[j].y;
      const u = x / W + 0.5, v = y / H + 0.5;
      const boundary = i === 0 || i === NX || j === 0 || j === NY;
      position.set([x, y, frontZ - depth * (boundary ? 0 : sampleInk(u, v))], vertex * 3);
      // Use a flat shading basis: the normal texture supplies the slope once.
      normal.set([0, 0, 1], vertex * 3);
      uv.set([u, v], vertex * 2);
    }
  }
  let index = 0;
  for (let j = 0; j < NY; j++) {
    for (let i = 0; i < NX; i++) {
      const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1;
      indices.set([a, b, d, a, d, c], index);
      index += 6;
    }
  }
  const faceGeometry = new THREE.BufferGeometry();
  faceGeometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  faceGeometry.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  faceGeometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  faceGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
  faceGeometry.computeBoundingBox();
  faceGeometry.computeBoundingSphere();
  geometries.push(faceGeometry);

  const normalCanvas = document.createElement('canvas');
  const roughnessCanvas = document.createElement('canvas');
  normalCanvas.width = roughnessCanvas.width = width;
  normalCanvas.height = roughnessCanvas.height = height;
  const normalContext = normalCanvas.getContext('2d')!;
  const roughnessContext = roughnessCanvas.getContext('2d')!;
  const normalImage = normalContext.createImageData(width, height);
  const roughnessImage = roughnessContext.createImageData(width, height);
  const dx = W / (width - 1), dy = H / (height - 1);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = y * width + x;
      const left = ink[y * width + Math.max(x - 1, 0)];
      const right = ink[y * width + Math.min(x + 1, width - 1)];
      const up = ink[Math.max(y - 1, 0) * width + x];
      const down = ink[Math.min(y + 1, height - 1) * width + x];
      const nx = depth * (right - left) / (2 * dx);
      const ny = -depth * (down - up) / (2 * dy);
      const length = Math.hypot(nx, ny, 1);
      normalImage.data.set([
        Math.round((nx / length * 0.5 + 0.5) * 255),
        Math.round((ny / length * 0.5 + 0.5) * 255),
        Math.round((1 / length * 0.5 + 0.5) * 255),
        255
      ], pixel * 4);
      const rough = Math.round((0.29 + 0.11 * ink[pixel]) * 255);
      roughnessImage.data.set([rough, rough, rough, 255], pixel * 4);
    }
  }
  normalContext.putImageData(normalImage, 0, 0);
  roughnessContext.putImageData(roughnessImage, 0, 0);
  const albedoTexture = new THREE.CanvasTexture(art.albedo);
  const normalTexture = new THREE.CanvasTexture(normalCanvas);
  const roughnessTexture = new THREE.CanvasTexture(roughnessCanvas);
  albedoTexture.colorSpace = THREE.SRGBColorSpace;
  normalTexture.colorSpace = THREE.NoColorSpace;
  roughnessTexture.colorSpace = THREE.NoColorSpace;
  const anisotropy = renderer && renderer.capabilities
    ? Math.min(renderer.capabilities.getMaxAnisotropy(), 4)
    : 1;
  [albedoTexture, normalTexture, roughnessTexture].forEach((texture) => {
    texture.flipY = true;
    texture.anisotropy = anisotropy;
    textures.push(texture);
  });
  const faceMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: albedoTexture,
    normalMap: normalTexture,
    normalMapType: THREE.TangentSpaceNormalMap,
    normalScale: new THREE.Vector2(1, 1),
    roughness: 1,
    roughnessMap: roughnessTexture,
    metalness: 0,
    clearcoat: 0.1,
    clearcoatRoughness: 0.31
  });
  materials.push(faceMaterial);
  group.add(new THREE.Mesh(faceGeometry, faceMaterial));
  group.userData.engraving = { width: W, height: H, depth, frontZ, gridX: NX, gridY: NY };
  return { group, materials, geometries, textures, depth };
  } catch (error) {
    geometries.forEach(item => item.dispose());
    materials.forEach(item => item.dispose());
    textures.forEach(item => item.dispose());
    throw error;
  }
}

