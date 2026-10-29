import { useEffect, useRef, useState } from 'react';
import type { PodiumScene } from './podiumScene';

export function PodiumModel({ name, place }: { name: string; place: number }) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef({ name, place }); current.current = { name, place };
  const refresh = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const element = host.current!;
    let scene: PodiumScene | undefined, disposed = false, loading = false, visible = true, failed = false;
    const fail = () => { if (disposed) return; failed = true; scene?.dispose(); scene = undefined; setReady(false); };
    const draw = () => { if (disposed || !visible || document.hidden || !scene) return; try { scene.resize(); scene.update(current.current.name, current.current.place); } catch { fail(); } };
    const start = async () => {
      if (disposed || loading || scene || failed || typeof window.WebGL2RenderingContext === 'undefined') return;
      loading = true;
      try {
        const module = await import('./podiumScene');
        if (disposed) return;
        scene = module.createPodiumScene(element, fail);
        setReady(true); draw();
      } catch { fail(); }
      finally { loading = false; }
    };
    refresh.current = draw;
    const observer = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting; if (visible) { void start(); draw(); }
    }, { rootMargin: '100px' }) : null;
    const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(draw) : null;
    observer?.observe(element); resize?.observe(element);
    if (!observer) void start();
    const visibility = () => { if (!document.hidden) { void start(); draw(); } };
    document.addEventListener('visibilitychange', visibility); window.addEventListener('resize', draw);
    return () => { disposed = true; refresh.current = null; observer?.disconnect(); resize?.disconnect(); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('resize', draw); scene?.dispose(); };
  }, []);
  useEffect(() => { refresh.current?.(); }, [name, place]);
  return <div className="podium-model" data-renderer={ready ? 'webgl' : 'fallback'} aria-hidden="true">
    <div className="podium-model-host" ref={host} />
    {!ready && <div className="podium-model-fallback"><div className="podium-model-tile"><strong>{Array.from(name)[0] ?? '雀'}</strong><span>{String(place).padStart(2, '0')}</span></div><div className="podium-model-base" /></div>}
  </div>;
}
