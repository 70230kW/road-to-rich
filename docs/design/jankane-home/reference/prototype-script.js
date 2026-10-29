(() => {
    const root=document.getElementById('jankane-focused-tiles');
    if(!root||root.dataset.jkReady)return;
    root.dataset.jkReady='true';
    const stage=root.querySelector('.jk-stage'),slides=[...root.querySelectorAll('[data-jk-slide]')],buttons=[...root.querySelectorAll('[data-jk-go]')];
    const fallback=root.querySelector('.jk-fallback'),fallbackTiles=[...root.querySelectorAll('[data-jk-tile]')];
    const prev=root.querySelector('[data-jk-prev]'),next=root.querySelector('[data-jk-next]'),live=root.querySelector('[data-jk-live]');
    const names=['順位表','対局入力','ダッシュボード','段位'],tileNames=['赤伍萬','發','七筒','一索'];
    const originalArt=JSON.parse(root.querySelector('#jankane-original-tile-art').textContent);
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');let reduced=media.matches;
    let position=0,target=0,velocity=0,frame=0,lastFrame=0,pointer=null,axis=null,lastPointerX=0,lastPointerTime=0,pointerVelocity=0;
    let renderScene=null,resizeScene=null,disposeScene=null,hoverX=0,hoverY=0,disposed=false;
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    const count=names.length,mod=(value,n)=>((value%n)+n)%n;
    const menuIndex=value=>mod(Math.round(value),count);
    const signedDistance=(index,p)=>mod(index-p+count/2,count)-count/2;
    const nearestPosition=index=>index+Math.round((position-index)/count)*count;
    root.dataset.jkLoop='true';
    function pose(index,p){
      // A closed orbit keeps all four tiles continuous through the 04 / 01 seam.
      const angle=(index-mod(p,count))*Math.PI*2/count;
      const side=Math.sin(angle),depth=(1-Math.cos(angle))/2;
      const focus=Math.exp(-7.8*depth),light=.025+.975*Math.exp(-5*depth);
      return {x:side*2.18,y:.16+depth*.85,z:.5-depth*4.1,scale:1.2-depth*.46,rx:-.07+depth*.14,ry:.12-side*.21,rz:-.055+side*.105,side,depth,focus,light};
    }
    function paint(){
      slides.forEach((slide,i)=>{const d=signedDistance(i,position);slide.style.opacity=String(clamp(1-Math.abs(d)*1.35,0,1));slide.style.transform='translate3d('+(reduced?0:d*65)+'px,0,0)';slide.style.visibility=Math.abs(d)>1?'hidden':'visible';});
      fallbackTiles.forEach((tile,i)=>{const v=pose(i,position);tile.style.opacity='1';tile.style.zIndex=String(Math.round((1-v.depth)*100));tile.style.filter='brightness('+(Math.pow(v.light,.6))+')';tile.style.transform='translate(-50%,-50%) translate3d('+(v.side*150)+'px,'+(-v.depth*48)+'px,'+(-v.depth*300)+'px) scale('+(1-v.depth*.39)+') rotateX('+(reduced?0:-5+v.depth*8)+'deg) rotateY('+(reduced?0:-16-v.side*18)+'deg) rotateZ('+(reduced?0:-3+v.side*7)+'deg)';});
      if(renderScene)renderScene(position,reduced,hoverX,hoverY);
      root.dataset.jkPosition=String(Math.round(position*1000)/1000);
    }
    function selection(index){
      index=menuIndex(index);
      buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));slides.forEach((s,i)=>s.setAttribute('aria-hidden',String(i!==index)));
      root.querySelector('.jk-count').textContent='0'+(index+1)+' / 04';root.querySelector('.jk-tile-name').textContent=tileNames[index];
      live.textContent=names[index]+'、'+tileNames[index]+'を選択中。4つ中'+(index+1)+'つ目。';root.dataset.jkSelected=String(index);
    }
    function tick(now){
      frame=0;const dt=Math.min((now-lastFrame)/1000||1/60,1/30);lastFrame=now;
      if(reduced){position=target;velocity=0;paint();return;}
      velocity+=(target-position)*235*dt;velocity*=Math.exp(-25*dt);position+=velocity*dt;
      if(Math.abs(target-position)<.0005&&Math.abs(velocity)<.006){position=target;velocity=0;paint();return;}
      paint();frame=requestAnimationFrame(tick);
    }
    function select(i){target=Math.round(i);root.dataset.jkTarget=String(target);selection(target);if(frame)cancelAnimationFrame(frame);lastFrame=performance.now();frame=requestAnimationFrame(tick);}
    buttons.forEach(b=>b.addEventListener('click',()=>select(nearestPosition(Number(b.dataset.jkGo)))));prev.addEventListener('click',()=>select(target-1));next.addEventListener('click',()=>select(target+1));
    root.addEventListener('keydown',e=>{const keys={ArrowRight:target+1,ArrowLeft:target-1,Home:nearestPosition(0),End:nearestPosition(3)};if(keys[e.key]!==undefined){e.preventDefault();select(keys[e.key]);}});
    stage.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,start:position};axis=null;lastPointerX=e.clientX;lastPointerTime=performance.now();pointerVelocity=0;if(frame){cancelAnimationFrame(frame);frame=0;}});
    stage.addEventListener('pointermove',e=>{
      if(!pointer){if(e.pointerType==='mouse'&&!reduced){const box=stage.getBoundingClientRect();hoverX=clamp((e.clientX-box.left)/box.width-.5,-.5,.5);hoverY=clamp((e.clientY-box.top)/box.height-.5,-.5,.5);paint();}return;}
      if(pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
      if(!axis&&Math.max(Math.abs(dx),Math.abs(dy))>7){axis=Math.abs(dx)>Math.abs(dy)?'x':'y';if(axis==='x'){stage.setPointerCapture(e.pointerId);stage.classList.add('jk-dragging');}}
      if(axis!=='x')return;
      const distance=Math.max(175,stage.clientWidth*.44);position=pointer.start-dx/distance;
      const now=performance.now(),v=-(e.clientX-lastPointerX)/Math.max(12,now-lastPointerTime)*1000/distance;pointerVelocity=pointerVelocity*.45+v*.55;lastPointerX=e.clientX;lastPointerTime=now;paint();
    });
    function release(e){if(!pointer||pointer.id!==e.pointerId)return;const horizontal=axis==='x';pointer=null;stage.classList.remove('jk-dragging');if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);if(horizontal){const v=performance.now()-lastPointerTime<110?pointerVelocity:0;velocity=clamp(v,-5,5);select(Math.round(position+clamp(v*.13,-.6,.6)));}else select(target);axis=null;}
    stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',e=>{pointerVelocity=0;release(e);});
    stage.addEventListener('pointerleave',()=>{if(!pointer){hoverX=0;hoverY=0;paint();}});
    media.addEventListener('change',e=>{reduced=e.matches;hoverX=0;hoverY=0;select(target);});
    selection(0);paint();
    const observer=new ResizeObserver(()=>{if(resizeScene)resizeScene();paint();});observer.observe(stage);

    function loadSource(source){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=source;});}
    function makeCanvas(width,height){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;return canvas;}
    function prepareArt(image,kind){
      const source=makeCanvas(image.naturalWidth,image.naturalHeight),ctx=source.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
      const sw=source.width,sh=source.height,sourcePixels=ctx.getImageData(0,0,sw,sh),data=sourcePixels.data;
      const clean=makeCanvas(sw,sh),cleanCtx=clean.getContext('2d'),cleanPixels=cleanCtx.createImageData(sw,sh);
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
      const albedo=makeCanvas(width,height),ac=albedo.getContext('2d');ac.fillStyle='rgb(244,241,230)';ac.fillRect(0,0,width,height);ac.imageSmoothingQuality='high';ac.drawImage(clean,minX,minY,bw,bh,dx,dy,dw,dh);
      const maskCanvas=makeCanvas(width,height),mc=maskCanvas.getContext('2d',{willReadFrequently:true});mc.imageSmoothingQuality='high';mc.drawImage(clean,minX,minY,bw,bh,dx,dy,dw,dh);
      const maskPixels=mc.getImageData(0,0,width,height).data,raw=new Float32Array(width*height),temp=new Float32Array(width*height),mask=new Float32Array(width*height);
      for(let n=0;n<raw.length;n++)raw[n]=maskPixels[n*4+3]/255;
      for(let y=0;y<height;y++)for(let x=0;x<width;x++){const n=y*width+x;temp[n]=(raw[y*width+Math.max(0,x-1)]+2*raw[n]+raw[y*width+Math.min(width-1,x+1)])/4;}
      for(let y=0;y<height;y++)for(let x=0;x<width;x++){const n=y*width+x;mask[n]=(temp[Math.max(0,y-1)*width+x]+2*temp[n]+temp[Math.min(height-1,y+1)*width+x])/4;}
      return {albedo,mask,width,height,sourceCrop:[minX,minY,bw,bh]};
    }
    function paintFallback(art,index){
      const canvas=fallbackTiles[index].querySelector('canvas'),ctx=canvas.getContext('2d');ctx.drawImage(art.albedo,0,0);
      const pixels=ctx.getImageData(0,0,art.width,art.height),a=pixels.data,w=art.width,h=art.height,m=art.mask;
      for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const n=y*w+x,slope=(m[n+1]-m[n-1])*.48+(m[n+w]-m[n-w])*.7;const shade=clamp(1-slope*.65,.60,1.25);for(let c=0;c<3;c++)a[n*4+c]=Math.min(255,a[n*4+c]*shade);}
      ctx.putImageData(pixels,0,0);
    }
    const artPromise=Promise.all(originalArt.map((a,i)=>loadSource(a.source).then(img=>{const art=prepareArt(img,a.kind);paintFallback(art,i);return art;})));
    artPromise.then(()=>{root.dataset.jkArt='ready';paint();}).catch(()=>{root.dataset.jkArt='error';});

    // The mesh helper is inserted from its separately reviewed source.
    function createEngravedTile(THREE, art, renderer) {
  const W = 1.34;
  const H = 1.98;
  const R = 0.09;
  const NX = 160;
  const NY = 240;
  const depth = 0.014;
  const width = art.width;
  const height = art.height;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const smoothstep = (value) => {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  };
  if (!art.albedo || !art.mask || width < 2 || height < 2 || art.mask.length !== width * height) {
    throw new Error('createEngravedTile requires an albedo canvas and a matching ink mask.');
  }
  const group = new THREE.Group();
  const geometries = [];
  const materials = [];
  const textures = [];

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
  const frontZ = closedBody.boundingBox.max.z;

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
    const values = new attribute.array.constructor(keep.length * attribute.itemSize);
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
  function sampleInk(u, v) {
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
  const normalContext = normalCanvas.getContext('2d');
  const roughnessContext = roughnessCanvas.getContext('2d');
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
}


    Promise.all([import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js'),artPromise]).then(([THREE,arts])=>{
      if(disposed||!root.isConnected)return;
      let renderer;
      try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch(e){root.dataset.jkRenderer='css3d';return;}
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));renderer.setClearColor(0x090d10,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
      root.querySelector('.jk-webgl').appendChild(renderer.domElement);
      const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(30,1,.1,100);camera.position.set(0,0,8.8);camera.lookAt(0,0,0);
      scene.fog=new THREE.FogExp2(0x090d10,.022);
      const studio=new THREE.Scene();studio.background=new THREE.Color(.055,.065,.075);
      const softboxes=[];
      [[5,3,-3,4,5,2.7],[2.2,5,4,0,3,1.3],[4,.6,0,-3,4,.8]].forEach(([w,h,x,y,z,power])=>{const geometry=new THREE.PlaneGeometry(w,h),material=new THREE.MeshBasicMaterial({color:new THREE.Color(power,power*.98,power*.92),side:THREE.DoubleSide});const panel=new THREE.Mesh(geometry,material);panel.position.set(x,y,z);panel.lookAt(0,0,0);studio.add(panel);softboxes.push(panel);});
      const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(studio,.12,.1,30);scene.environment=environment.texture;scene.environmentIntensity=.4;pmrem.dispose();softboxes.forEach(p=>{p.geometry.dispose();p.material.dispose();});
      scene.add(new THREE.HemisphereLight(0xe9f0ff,0x304537,.78));
      const key=new THREE.DirectionalLight(0xfff7e9,3.0);key.position.set(-3.8,5.2,6.8);scene.add(key);
      const fill=new THREE.DirectionalLight(0xd3e0ee,.62);fill.position.set(5,-1,3);scene.add(fill);
      const rim=new THREE.DirectionalLight(0xd3b878,1.35);rim.position.set(2.5,3,-3);scene.add(rim);
      const group=new THREE.Group();scene.add(group);
      const tiles=arts.map(art=>createEngravedTile(THREE,art,renderer));tiles.forEach(tile=>{tile.materials.forEach(m=>{m.userData.baseColor=m.color.clone();m.userData.baseEnvMapIntensity=m.envMapIntensity;m.userData.baseSpecularIntensity=m.specularIntensity;m.userData.baseClearcoat=m.clearcoat;});group.add(tile.group);});
      let mobile=false;
      resizeScene=()=>{const w=stage.clientWidth,h=stage.clientHeight;mobile=w<=560;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();const wh=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.position.z,ww=wh*camera.aspect;group.position.set(mobile?0:ww*.235,mobile?wh*.15:wh*.02,0);group.scale.setScalar(mobile?Math.min(.95,ww/3.4):1.05);};
      renderScene=(p,isReduced,hx,hy)=>{
        tiles.forEach((tile,i)=>{
          const v=pose(i,p);
          tile.group.position.set(v.x,v.y,v.z);tile.group.scale.setScalar(v.scale);
          tile.group.rotation.set(isReduced?0:v.rx+hy*.10*v.focus,isReduced?0:v.ry-(mobile?.42:0)+hx*.18*v.focus,isReduced?0:v.rz);
          tile.materials.forEach(m=>{
            m.color.copy(m.userData.baseColor).multiplyScalar(v.light);
            m.envMapIntensity=m.userData.baseEnvMapIntensity*v.light;
            m.specularIntensity=m.userData.baseSpecularIntensity*v.light;
            m.clearcoat=m.userData.baseClearcoat*v.light;
          });
        });
        renderer.render(scene,camera);
      };
      disposeScene=()=>{tiles.forEach(t=>{t.geometries.forEach(g=>g.dispose());t.materials.forEach(m=>m.dispose());t.textures.forEach(t=>t.dispose());});environment.dispose();renderer.dispose();};
      renderer.domElement.addEventListener('webglcontextlost',()=>{fallback.hidden=false;renderScene=null;root.dataset.jkRenderer='css3d';});
      resizeScene();paint();fallback.hidden=true;root.dataset.jkRenderer='webgl';root.dataset.jkRecessDepth=String(tiles[0].depth);root.dataset.jkTileCount=String(tiles.length);
    }).catch(error=>{root.dataset.jkRenderer='css3d';root.dataset.jkRenderError=String(error.message||error);});
    const cleanup=new MutationObserver(()=>{if(!root.isConnected){disposed=true;if(frame)cancelAnimationFrame(frame);observer.disconnect();if(disposeScene)disposeScene();cleanup.disconnect();}});cleanup.observe(document.documentElement,{childList:true,subtree:true});
  })();
