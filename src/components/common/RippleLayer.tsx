import { useEffect, useState } from 'react';

interface RippleInstance {
  id: number;
  left: number;
  top: number;
  width: number;
  height: number;
  borderRadius: string;
  x: number;
  y: number;
  size: number;
}

let nextRippleId = 0;
const RIPPLE_DURATION_MS = 600;

/**
 * button要素をタップ/クリックした位置から波紋が広がるタップエフェクト。
 * 各ボタンを個別に書き換えずに済むよう、document全体でポインタイベントを委譲して検出する。
 */
export function RippleLayer() {
  const [ripples, setRipples] = useState<RippleInstance[]>([]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button:not(:disabled)');
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const id = nextRippleId++;

      setRipples((prev) => [
        ...prev,
        {
          id,
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          borderRadius: getComputedStyle(target).borderRadius,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          size,
        },
      ]);

      window.setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, RIPPLE_DURATION_MS);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  if (ripples.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[999]" aria-hidden="true">
      {ripples.map((r) => (
        <div
          key={r.id}
          className="fixed overflow-hidden"
          style={{ left: r.left, top: r.top, width: r.width, height: r.height, borderRadius: r.borderRadius }}
        >
          <span
            className="absolute rounded-full bg-white/40 animate-ripple"
            style={{ left: r.x - r.size / 2, top: r.y - r.size / 2, width: r.size, height: r.size }}
          />
        </div>
      ))}
    </div>
  );
}
