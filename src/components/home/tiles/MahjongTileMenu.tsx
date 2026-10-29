import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { TILE_MENUS } from './tileMenus';
import { clamp, menuIndex, nearestPosition, signedDistance, springStep, tilePose } from './tileMotion';
import type { TileScene } from './tileScene';
import { FALLBACK_TITLE_LAYER, MINCHO_FONT, tileLayout, titleFrame, titleLines } from './tileTypography';
import './mahjongTiles.css';

export function MahjongTileMenu({ initialIndex = 0, onSelectionChange, onOpen }: {
  initialIndex?: number; onSelectionChange?: (index: number) => void; onOpen: (id: string) => void;
}) {
  const [selected, setSelected] = useState(menuIndex(initialIndex));
  const [rendererState, setRendererState] = useState('loading');
  const rootRef = useRef<HTMLElement>(null);
  const controls = useRef<{ step: (delta: number) => void; select: (index: number) => void } | null>(null);
  const callbacks = useRef({ onSelectionChange, onOpen });
  callbacks.current = { onSelectionChange, onOpen };
  const initial = useRef(menuIndex(initialIndex));

  useEffect(() => {
    const root = rootRef.current!;
    const stage = root.querySelector<HTMLDivElement>('.jk-stage')!;
    const host = root.querySelector<HTMLDivElement>('.jk-webgl')!;
    const fallback = root.querySelector<HTMLDivElement>('.jk-fallback')!;
    const slides = [...root.querySelectorAll<HTMLElement>('.jk-slide')];
    const fallbackTiles = [...root.querySelectorAll<HTMLElement>('.jk-fallback-tile')];
    const fallbackTitles = [...root.querySelectorAll<HTMLElement>('.jk-fallback-title')];
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reduced = media?.matches ?? false, position = initial.current, target = position, velocity = 0;
    let frame = 0, lastFrame = 0, disposed = false, visible = true, hoverX = 0, hoverY = 0;
    let scene: TileScene | undefined;
    let pointer: { id: number; x: number; y: number; start: number; settled: boolean } | null = null;
    let axis: 'x' | 'y' | null = null, lastX = 0, lastTime = 0, pointerVelocity = 0;
    const abort = new AbortController();
    const paint = () => {
      if (disposed || !visible || document.hidden) return;
      slides.forEach((slide, index) => {
        const d = signedDistance(index, position);
        slide.style.opacity = String(clamp(1 - Math.abs(d) * 1.35, 0, 1));
        slide.style.transform = `translate3d(${reduced ? 0 : d * 65}px,0,0)`;
        slide.style.visibility = Math.abs(d) > 1 ? 'hidden' : 'visible';
      });
      if (!scene) fallbackTiles.forEach((tile, index) => {
        const v = tilePose(index, position);
        tile.style.zIndex = String(Math.round((1 - v.depth) * 100));
        tile.style.filter = `brightness(${Math.pow(v.light, .6)})`;
        tile.style.transform = `translate(-50%,-50%) translate3d(${v.side * Math.min(150, stage.clientWidth * .33)}px,${-v.depth * 48}px,${-v.depth * 300}px) scale(${1 - v.depth * .39}) rotateX(${reduced ? 0 : -5 + v.depth * 8}deg) rotateY(${reduced ? 0 : -16 - v.side * 18}deg) rotateZ(${reduced ? 0 : -3 + v.side * 7}deg)`;
      });
      if (!scene) fallbackTitles.forEach((title, index) => {
        const frame = titleFrame(index, position, reduced);
        title.style.opacity = String(frame.opacity);
        title.style.transform = `translateX(${frame.offset * stage.clientWidth}px)`;
      });
      try { scene?.render(position, reduced, hoverX, hoverY); }
      catch { fail(); }
      root.dataset.position = String(position);
      root.dataset.target = String(target);
    };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const tick = (now: number) => {
      frame = 0;
      if (!visible || document.hidden || disposed) return;
      if (reduced) { position = target; velocity = 0; }
      else if (!pointer) {
        const next = springStep(position, target, velocity, Math.min((now - lastFrame) / 1000, .25));
        position = next.position; velocity = next.velocity;
      }
      lastFrame = now;
      const settled = Math.abs(target - position) < .0005 && Math.abs(velocity) < .006;
      if (settled && !pointer) { position = target; velocity = 0; }
      paint();
      if (!frame && !pointer && !settled && !reduced) frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!frame && visible && !document.hidden && !disposed) { lastFrame = performance.now(); frame = requestAnimationFrame(tick); }
    };
    const select = (value: number) => {
      target = Math.round(value);
      const index = menuIndex(target);
      setSelected(index); callbacks.current.onSelectionChange?.(index);
      if (reduced) { position = target; velocity = 0; }
      wake();
    };
    controls.current = { step: delta => select(target + delta), select: index => select(nearestPosition(index, position)) };
    const down = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0 || pointer) return;
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, start: position, settled: Math.abs(position - target) < .02 };
      axis = null; lastX = event.clientX; lastTime = performance.now(); pointerVelocity = 0; stop();
    };
    const move = (event: PointerEvent) => {
      if (!pointer) {
        if (event.pointerType === 'mouse' && !reduced) {
          const box = stage.getBoundingClientRect();
          hoverX = clamp((event.clientX - box.left) / box.width - .5, -.5, .5);
          hoverY = clamp((event.clientY - box.top) / box.height - .5, -.5, .5); wake();
        }
        return;
      }
      if (pointer.id !== event.pointerId) return;
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
      if (!axis && Math.max(Math.abs(dx), Math.abs(dy)) > 7) {
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (axis === 'x') { stage.setPointerCapture(event.pointerId); stage.classList.add('jk-dragging'); }
      }
      if (axis !== 'x') return;
      const distance = Math.max(175, stage.clientWidth * .44), now = performance.now();
      position = pointer.start - dx / distance;
      const v = -(event.clientX - lastX) / Math.max(12, now - lastTime) * 1000 / distance;
      pointerVelocity = pointerVelocity * .45 + v * .55; lastX = event.clientX; lastTime = now;
      // Coalesce pointer events into one paint per frame without a React update.
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(() => { frame = 0; paint(); });
    };
    const release = (event: PointerEvent) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const old = pointer, horizontal = axis === 'x';
      const tap = event.type === 'pointerup' && axis === null && old.settled && Math.hypot(event.clientX - old.x, event.clientY - old.y) <= 7;
      pointer = null; axis = null; stage.classList.remove('jk-dragging'); stop();
      if (stage.hasPointerCapture?.(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      if (horizontal) {
        const v = event.type === 'pointerup' && performance.now() - lastTime < 110 ? pointerVelocity : 0;
        velocity = clamp(v, -5, 5); select(Math.round(position + clamp(v * .13, -.6, .6)));
      } else { wake(); }
      // No click handler on the stage: synthesized clicks after a swipe cannot open a screen.
      const index = menuIndex(target);
      if (tap && (scene ? scene.hit(event.clientX, event.clientY, index) : fallbackTiles[index].contains(event.target as Node))) {
        callbacks.current.onOpen(TILE_MENUS[index].id);
      }
    };
    const leave = () => {
      // Horizontal drags are captured; uncaptured taps/vertical gestures can leave the stage.
      if (pointer && axis !== 'x') { pointer = null; axis = null; stop(); }
      if (!pointer) { hoverX = hoverY = 0; wake(); }
    };
    const changeMotion = () => { reduced = media?.matches ?? false; hoverX = hoverY = 0; select(target); };
    const visibility = () => { if (document.hidden) { stop(); pointer = null; axis = null; stage.classList.remove('jk-dragging'); } else wake(); };
    const resize = () => {
      const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
      const { title, tile } = tileLayout(w, h);
      fallbackTitles.forEach((element, index) => {
        const lines = titleLines(TILE_MENUS[index].name);
        element.style.left = `${title.left * 100}%`; element.style.top = `${title.top * 100}%`;
        element.style.fontSize = `${Math.min(w * title.width * .96 / Math.max(...lines.map(line => line.length)), h * title.height / (lines.length * 1.12 + .24))}px`;
      });
      fallbackTiles.forEach(element => {
        const tileWidth = Math.min(w * tile.width, h * tile.height * 1.34 / 1.98) * .84;
        element.style.left = `${tile.x * 100}%`; element.style.top = `${tile.y * 100}%`;
        element.style.width = `${tileWidth}px`; element.style.height = `${tileWidth * 1.98 / 1.34}px`;
      });
      try { scene?.resize(); } catch { fail(); } wake();
    };
    stage.addEventListener('pointerdown', down); stage.addEventListener('pointermove', move);
    stage.addEventListener('pointerup', release); stage.addEventListener('pointercancel', release);
    stage.addEventListener('lostpointercapture', release); stage.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', visibility); media?.addEventListener('change', changeMotion);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    observer?.observe(stage); window.addEventListener('resize', resize);
    const intersection = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) wake(); else stop();
    }) : null;
    intersection?.observe(stage);
    const fail = () => {
      if (disposed) return;
      abort.abort();
      scene?.dispose(); scene = undefined; fallback.hidden = false; setRendererState('fallback'); wake();
    };
    // Unsupported environments never import the GPU code. The original art and controls work immediately.
    if (typeof window.WebGL2RenderingContext === 'undefined') fail();
    else void import('./tileScene').then(module => {
      if (disposed) return;
      return module.createTileScene(host, stage, abort.signal, fail);
    }).then(result => {
      if (!result) return;
      if (disposed) { result.dispose(); return; }
      scene = result; fallback.hidden = true; setRendererState('webgl'); wake();
    }).catch(fail);
    resize(); paint();
    return () => {
      disposed = true; abort.abort(); stop(); controls.current = null;
      observer?.disconnect(); intersection?.disconnect(); scene?.dispose();
      stage.removeEventListener('pointerdown', down); stage.removeEventListener('pointermove', move);
      stage.removeEventListener('pointerup', release); stage.removeEventListener('pointercancel', release);
      stage.removeEventListener('lostpointercapture', release); stage.removeEventListener('pointerleave', leave);
      media?.removeEventListener('change', changeMotion); document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const menu = TILE_MENUS[selected];
  return <section ref={rootRef} className="mahjong-home-menu" aria-label="麻雀牌のホームメニュー" aria-roledescription="カルーセル" data-renderer={rendererState} onKeyDown={event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); controls.current?.step(event.key === 'ArrowRight' ? 1 : -1); }
    if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); controls.current?.select(event.key === 'Home' ? 0 : 3); }
  }}>
    <div className="jk-glow" aria-hidden="true" />
    <header className="jk-header"><span className="jk-home-label">TOP</span><span className="jk-header-line" aria-hidden="true" /><span className="jk-header-note">一枚を選んで、次の一手へ。</span></header>
    <div className="jk-stage" data-pull-ignore tabIndex={0} aria-label="牌を左右にスワイプして選択。選択した牌をタップして開く。キーボードでは左右キーと下の開くボタンを使用。">
      <div className="jk-webgl" aria-hidden="true" />
      <div className="jk-fallback" aria-hidden="true">
        {TILE_MENUS.map((item, index) => <div className="jk-fallback-tile" key={item.id} data-tile={index}><img src={item.source} alt="" draggable={false} /></div>)}
        {TILE_MENUS.map((item, index) => <div className="jk-fallback-title" key={item.id} style={{ fontFamily: MINCHO_FONT, zIndex: FALLBACK_TITLE_LAYER, opacity: index === initial.current ? 1 : 0 }}>{titleLines(item.name).map(line => <span key={line}>{line}</span>)}</div>)}
      </div>
      <div className="jk-copy">{TILE_MENUS.map((item, index) => <div className="jk-slide" key={item.id} data-jk-slide={index} aria-hidden={index !== selected}><div className="jk-eyebrow">{item.eyebrow}</div><h2 className="jk-title-a11y">{item.name}</h2><p className="jk-description">{item.description}</p></div>)}</div>
      <div className="jk-selection"><span className="jk-count">0{selected + 1} / 04</span><span className="jk-divider" /><span className="jk-tile-name">{menu.tile}</span></div>
    </div>
    <div className="jk-action"><button type="button" className="jk-open" onClick={() => onOpen(menu.id)}>{menu.name}を開く<ArrowUpRight size={18} aria-hidden="true" /></button></div>
    <div className="jk-nav-zone">
      <nav className="jk-nav" aria-label="メニューを選択">{TILE_MENUS.map((item, index) => <button className="jk-menu" key={item.id} type="button" aria-label={`0${index + 1} ${item.name}`} aria-pressed={selected === index} onClick={() => controls.current?.select(index)}><span className="jk-menu-number">0{index + 1}</span>{item.name}</button>)}</nav>
      <div className="jk-footer"><span className="jk-hint">左右にスワイプして選択<br />牌のタップ、またはボタンで開く</span><div className="jk-arrows"><button className="jk-arrow" type="button" aria-label="前のメニュー" onClick={() => controls.current?.step(-1)}><ArrowLeft size={18} /></button><button className="jk-arrow" type="button" aria-label="次のメニュー" onClick={() => controls.current?.step(1)}><ArrowRight size={18} /></button></div></div>
    </div>
    <span className="jk-sr" role="status" aria-live="polite" aria-atomic="true">{menu.name}、{menu.tile}を選択中。4つ中{selected + 1}つ目。</span>
  </section>;
}
