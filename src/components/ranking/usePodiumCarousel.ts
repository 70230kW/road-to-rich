import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { springStep } from '../home/tiles/tileMotion';

const wrap = (value: number, count: number) => ((value % count) + count) % count;
export const podiumOffset = (index: number, position: number, count: number) => count < 2 ? 0 : wrap(index - position + count / 2, count) - count / 2;

/** Continuous positions keep the 3→1 seam outside the clipped viewport, with no cloned GPUs. */
export function usePodiumCarousel(ids: string[]) {
  const viewport = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const index = Math.max(0, ids.indexOf(selectedId ?? ''));
  const control = useRef({ select: (_index: number) => {}, step: (_delta: number) => {}, cancel: () => {} });
  const state = useRef({ position: 0, target: 0, velocity: 0, frame: 0 });
  const gesture = useRef<{ id: number; x: number; y: number; position: number; width: number; axis: 'x' | 'y' | null } | null>(null);
  const suppressClick = useRef(false);
  const rosterKey = JSON.stringify(ids);
  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element || ids.length === 0) return;
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const s = state.current;
    s.position = s.target = index; s.velocity = 0;
    let disposed = false, lastTime = 0;
    const paint = () => element.querySelectorAll<HTMLElement>('[data-podium-slide]').forEach((slide, i) => {
      slide.style.transform = `translate3d(${podiumOffset(i, s.position, ids.length) * 100}%,0,0)`;
    });
    const stop = () => { cancelAnimationFrame(s.frame); s.frame = 0; lastTime = 0; };
    const frame = (now: number) => {
      s.frame = 0;
      if (disposed) return;
      const next = springStep(s.position, s.target, s.velocity, Math.min(.064, lastTime ? (now - lastTime) / 1000 : 1 / 60));
      s.position = next.position; s.velocity = next.velocity; lastTime = now;
      if (Math.abs(s.position - s.target) < .001 && Math.abs(s.velocity) < .01) { s.position = s.target; s.velocity = 0; lastTime = 0; }
      else s.frame = requestAnimationFrame(frame);
      paint();
    };
    const settle = (target: number) => {
      s.target = target;
      const next = wrap(target, ids.length);
      const focusedSlide = document.activeElement?.closest('[data-podium-slide]');
      if (focusedSlide && element.contains(focusedSlide) && focusedSlide.getAttribute('data-podium-slide') !== String(next)) element.focus({ preventScroll: true });
      setSelectedId(ids[next]);
      if (motion?.matches || document.hidden) { stop(); s.position = target; s.velocity = 0; paint(); }
      else if (!s.frame) s.frame = requestAnimationFrame(frame);
    };
    const cancel = () => {
      const start = gesture.current; gesture.current = null; element.removeAttribute('data-dragging');
      if (start) { if (element.hasPointerCapture?.(start.id)) element.releasePointerCapture(start.id); settle(Math.round(start.position)); }
    };
    control.current = {
      select: i => { cancel(); settle(i + Math.round((s.position - i) / ids.length) * ids.length); },
      step: delta => { cancel(); settle(Math.round(s.target) + delta); }, cancel,
    };
    const move = (event: PointerEvent) => {
      const start = gesture.current; if (!start || start.id !== event.pointerId) return;
      const dx = event.clientX - start.x, dy = event.clientY - start.y;
      if (!start.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
        start.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (start.axis === 'x') { stop(); element.setPointerCapture(event.pointerId); element.dataset.dragging = 'true'; }
      }
      if (start.axis !== 'x') return;
      event.preventDefault();
      suppressClick.current = true;
      s.position = start.position - dx / start.width; s.velocity = 0; paint();
    };
    const up = (event: PointerEvent) => {
      const start = gesture.current; if (!start || start.id !== event.pointerId) return;
      gesture.current = null; element.removeAttribute('data-dragging');
      if (element.hasPointerCapture?.(start.id)) element.releasePointerCapture(start.id);
      if (start.axis === 'x') {
        const distance = s.position - start.position;
        settle(Math.round(s.position + (Math.abs(distance) > .18 ? Math.sign(distance) * .32 : 0)));
      }
    };
    const pause = () => { if (document.hidden || motion?.matches) { cancel(); stop(); s.position = s.target; s.velocity = 0; paint(); } };
    paint(); element.addEventListener('pointermove', move); element.addEventListener('pointerup', up);
    document.addEventListener('visibilitychange', pause); motion?.addEventListener('change', pause);
    return () => {
      disposed = true; stop(); gesture.current = null;
      element.removeEventListener('pointermove', move); element.removeEventListener('pointerup', up);
      document.removeEventListener('visibilitychange', pause); motion?.removeEventListener('change', pause);
    };
    // Reset only for a changed roster, never for each selected player or refreshed amount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rosterKey]);

  return {
    viewport, index, select: (i: number) => control.current.select(i), step: (delta: number) => control.current.step(delta),
    onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
      suppressClick.current = false;
      if (ids.length < 2 || event.button !== 0 || !event.isPrimary || gesture.current || (event.target as Element).closest('button,[data-model-interaction]')) return;
      gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, position: state.current.position, width: Math.max(1, event.currentTarget.clientWidth), axis: null };
    },
    onPointerCancel: () => control.current.cancel(), onLostPointerCapture: () => control.current.cancel(),
    onClickCapture: (event: React.MouseEvent) => { if (suppressClick.current && event.detail > 0) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } },
    onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); control.current.step(event.key === 'ArrowLeft' ? -1 : 1); }
    },
  };
}
