import { useEffect, useId, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { PodiumScene } from './podiumScene';

let sceneModule: Promise<typeof import('./podiumScene')> | undefined;
const loadScene = () => sceneModule ??= import('./podiumScene');

export function PodiumModel({ name, place, active = true }: { name: string; place: number; active?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const model = useRef<PodiumScene | null>(null);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const hintId = useId();
  const current = useRef({ name, place }); current.current = { name, place };
  const refresh = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const element = host.current!;
    let scene: PodiumScene | undefined, disposed = false, loading = false, visible = typeof IntersectionObserver === 'undefined', failed = false;
    const fail = () => { if (disposed) return; failed = true; scene?.dispose(); scene = undefined; model.current = null; setReady(false); };
    const draw = () => { if (disposed || !visible || document.hidden || !scene) return; try { scene.resize(); scene.update(current.current.name, current.current.place); } catch { fail(); } };
    const start = async () => {
      if (disposed || loading || scene || failed || !visible || document.hidden || typeof window.WebGL2RenderingContext === 'undefined') return;
      loading = true;
      try {
        const module = await loadScene();
        if (disposed || !visible || document.hidden) return;
        scene = module.createPodiumScene(element, fail);
        model.current = scene;
        setReady(true); draw();
      } catch { fail(); }
      finally { loading = false; }
    };
    refresh.current = draw;
    const observer = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting; if (visible) { void start(); draw(); }
    }, { rootMargin: '0px' }) : null;
    const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(draw) : null;
    observer?.observe(element); resize?.observe(element);
    if (!observer) void start();
    const visibility = () => { pointer.current = null; if (!document.hidden) { void start(); draw(); } };
    document.addEventListener('visibilitychange', visibility); window.addEventListener('resize', draw);
    return () => { disposed = true; refresh.current = null; model.current = null; pointer.current = null; observer?.disconnect(); resize?.disconnect(); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('resize', draw); scene?.dispose(); };
  }, []);
  useEffect(() => { refresh.current?.(); }, [name, place]);
  useEffect(() => { if (!active) pointer.current = null; }, [active]);
  const cancel = () => { pointer.current = null; };
  return <div className="podium-model" data-renderer={ready ? 'webgl' : 'fallback'} data-model-interaction data-pull-ignore>
    <div className="podium-model-rotation" role="group" tabIndex={ready && active ? 0 : -1} aria-label={`${name}の3D麻雀牌`} aria-describedby={hintId}
      onPointerDown={event => {
        if (!ready || !active || event.button !== 0 || !event.isPrimary || pointer.current) return;
        event.stopPropagation();
        pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      }} onPointerMove={event => {
        const start = pointer.current; if (!start || start.id !== event.pointerId) return;
        const scale = Math.PI * 2 / Math.max(100, event.currentTarget.clientWidth);
        model.current?.rotate((event.clientX - start.x) * scale, (event.clientY - start.y) * scale);
        start.x = event.clientX; start.y = event.clientY;
      }} onPointerUp={event => { if (pointer.current?.id !== event.pointerId) return; cancel(); if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
      onPointerCancel={cancel} onLostPointerCapture={cancel}
      onKeyDown={event => {
        if (!ready || !active) return;
        const keys: Record<string, [number, number]> = { ArrowLeft: [-.22, 0], ArrowRight: [.22, 0], ArrowUp: [0, -.22], ArrowDown: [0, .22] };
        if (keys[event.key]) { event.preventDefault(); event.stopPropagation(); model.current?.rotate(...keys[event.key]); }
        else if (event.key === 'Home') { event.preventDefault(); event.stopPropagation(); model.current?.resetRotation(); }
      }}>
      <div className="podium-model-host" ref={host} aria-hidden="true" />
      {!ready && <div className="podium-model-fallback" aria-hidden="true"><div className="podium-model-tile"><strong>{Array.from(name)[0] ?? '雀'}</strong><span>{String(place).padStart(2, '0')}</span></div><div className="podium-model-base" /></div>}
    </div>
    <p className="podium-model-hint" id={hintId}>{ready ? <>ドラッグで360°回転<span className="sr-only">。矢印キーでも回転、Homeキーで正面に戻ります。</span></> : '麻雀牌プレビュー（静止画）'}</p>
    {ready && <button type="button" className="podium-model-reset" aria-label={`${name}の牌を正面に戻す`} onClick={() => model.current?.resetRotation()}><RotateCcw size={13} aria-hidden="true" />正面に戻す</button>}
  </div>;
}
