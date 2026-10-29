import { useEffect, useRef, useState } from 'react';
import type { PodiumScene } from './podiumScene';
import { SceneLoading } from '../common/SceneLoading';

let sceneModule: Promise<typeof import('./podiumScene')> | undefined;
const loadScene = () => sceneModule ??= import('./podiumScene');

export function PodiumModel({ name, place }: { name: string; place: number }) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef({ name, place }); current.current = { name, place };
  const refresh = useRef<(() => void) | null>(null);
  const [rendererState, setRendererState] = useState<'loading' | 'webgl' | 'fallback'>('loading');
  useEffect(() => {
    const element = host.current!;
    let scene: PodiumScene | undefined, disposed = false, loading = false, visible = typeof IntersectionObserver === 'undefined', failed = false;
    const fail = () => { if (disposed || failed) return; failed = true; scene?.dispose(); scene = undefined; setRendererState('fallback'); };
    const draw = () => { if (disposed || !visible || document.hidden || !scene) return; try { scene.resize(); scene.update(current.current.name, current.current.place); } catch { fail(); } };
    const start = async () => {
      if (disposed || loading || scene || failed || !visible || document.hidden) return;
      if (typeof window.WebGL2RenderingContext === 'undefined') { fail(); return; }
      loading = true;
      try {
        const module = await loadScene();
        if (disposed || !visible || document.hidden) return;
        scene = module.createPodiumScene(element, fail);
        scene.resize(); scene.update(current.current.name, current.current.place); scene.flush();
        if (!failed) setRendererState('webgl');
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
    const visibility = () => { if (!document.hidden) { void start(); draw(); } };
    document.addEventListener('visibilitychange', visibility); window.addEventListener('resize', draw);
    return () => { disposed = true; refresh.current = null; observer?.disconnect(); resize?.disconnect(); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('resize', draw); scene?.dispose(); };
  }, []);
  useEffect(() => { refresh.current?.(); }, [name, place]);
  return <div className="podium-model" data-renderer={rendererState}>
    <div className="podium-model-host" ref={host} role="img" aria-label={`${name}の麻雀牌、${place}位`} />
    {rendererState === 'loading' && <SceneLoading />}
    {rendererState === 'fallback' && <div className="podium-model-fallback" aria-hidden="true"><div className="podium-model-tile"><strong>{Array.from(name)[0] ?? '雀'}</strong><span>{String(place).padStart(2, '0')}</span></div><div className="podium-model-base" /></div>}
  </div>;
}
