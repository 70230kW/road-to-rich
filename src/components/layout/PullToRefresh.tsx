import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, Check, RefreshCw, WifiOff } from 'lucide-react';
import { haptic } from '../../lib/haptics';

const TRIGGER_DISTANCE = 72;
const MAX_DISTANCE = 112;
const RESISTANCE = 0.45;
const RESULT_DISPLAY_MS = 720;

type PullPhase = 'idle' | 'pulling' | 'ready' | 'refreshing' | 'success' | 'error';

const PHASE_LABELS: Record<PullPhase, string> = {
  idle: '',
  pulling: '引っ張って更新',
  ready: '離して更新',
  refreshing: 'データを同期中…',
  success: '最新の状態です',
  error: '更新できませんでした',
};

function isGestureBlocked(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(
    'input, textarea, select, [contenteditable="true"], [role="dialog"], [data-pull-ignore]',
  ));
}

export function PullToRefresh({ children, onRefresh }: { children: ReactNode; onRefresh: () => Promise<void> }) {
  const [phase, setPhase] = useState<PullPhase>('idle');
  const [distance, setDistance] = useState(0);
  const startY = useRef(0);
  const distanceRef = useRef(0);
  const dragging = useRef(false);
  const refreshing = useRef(false);
  const thresholdNotified = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshRef = useRef(onRefresh);

  useEffect(() => {
    refreshRef.current = onRefresh;
  }, [onRefresh]);

  const reset = useCallback(() => {
    distanceRef.current = 0;
    setDistance(0);
    setPhase('idle');
  }, []);

  const runRefresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    distanceRef.current = 56;
    setDistance(56);
    setPhase('refreshing');

    try {
      await refreshRef.current();
      setPhase('success');
      haptic('success');
    } catch {
      setPhase('error');
      haptic('warning');
    } finally {
      resetTimer.current = setTimeout(() => {
        refreshing.current = false;
        reset();
      }, RESULT_DISPLAY_MS);
    }
  }, [reset]);

  useEffect(() => {
    const onTouchStart = (event: TouchEvent) => {
      if (refreshing.current || event.touches.length !== 1 || window.scrollY > 0 || isGestureBlocked(event.target)) return;
      startY.current = event.touches[0].clientY;
      distanceRef.current = 0;
      thresholdNotified.current = false;
      dragging.current = true;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!dragging.current || event.touches.length !== 1) return;
      const delta = event.touches[0].clientY - startY.current;
      if (delta <= 0) {
        reset();
        return;
      }

      event.preventDefault();
      const nextDistance = Math.min(MAX_DISTANCE, delta * RESISTANCE);
      distanceRef.current = nextDistance;
      setDistance(nextDistance);
      const isReady = nextDistance >= TRIGGER_DISTANCE;
      setPhase(isReady ? 'ready' : 'pulling');

      if (isReady && !thresholdNotified.current) {
        thresholdNotified.current = true;
        haptic('light');
      } else if (!isReady) {
        thresholdNotified.current = false;
      }
    };

    const finishGesture = () => {
      if (!dragging.current) return;
      dragging.current = false;
      if (distanceRef.current >= TRIGGER_DISTANCE) void runRefresh();
      else reset();
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', finishGesture, { passive: true });
    window.addEventListener('touchcancel', finishGesture, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', finishGesture);
      window.removeEventListener('touchcancel', finishGesture);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      refreshing.current = false;
    };
  }, [reset, runRefresh]);

  const Icon = phase === 'success' ? Check : phase === 'error' ? WifiOff : phase === 'pulling' ? ArrowDown : RefreshCw;
  const indicatorDistance = Math.min(distance, 66);

  return (
    <>
      <div
        className={`pull-refresh-indicator is-${phase}`}
        style={{ transform: `translate(-50%, ${indicatorDistance}px)`, opacity: phase === 'idle' ? 0 : 1 }}
        role="status"
        aria-live="polite"
        aria-hidden={phase === 'idle'}
      >
        <span className="pull-refresh-icon"><Icon aria-hidden="true" /></span>
        <span>{PHASE_LABELS[phase]}</span>
      </div>
      {children}
    </>
  );
}
