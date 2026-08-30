import { useEffect } from 'react';

const RIPPLE_DURATION_MS = 600;

/**
 * button要素をタップ/クリックした位置から波紋が広がるタップエフェクト。
 * 波紋はタップされたボタン自身の子要素として挿入するため、ページや内部コンテナが
 * スクロールしてもボタンにそのまま追従する。各ボタンを個別に書き換えずに済むよう、
 * document全体でポインタイベントを委譲して検出する。
 */
export function RippleLayer() {
  useEffect(() => {
    const activeRippleCount = new WeakMap<HTMLElement, number>();
    const priorStyles = new WeakMap<HTMLElement, { position: string; overflow: string }>();

    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button:not(:disabled)');
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (!priorStyles.has(target)) {
        priorStyles.set(target, { position: target.style.position, overflow: target.style.overflow });
      }
      if (!getComputedStyle(target).position || getComputedStyle(target).position === 'static') {
        target.style.position = 'relative';
      }
      target.style.overflow = 'hidden';
      activeRippleCount.set(target, (activeRippleCount.get(target) ?? 0) + 1);

      const ripple = document.createElement('span');
      ripple.className = 'pointer-events-none absolute rounded-full bg-white/40 animate-ripple';
      ripple.style.left = `${x - size / 2}px`;
      ripple.style.top = `${y - size / 2}px`;
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      target.appendChild(ripple);

      window.setTimeout(() => {
        ripple.remove();
        const remaining = (activeRippleCount.get(target) ?? 1) - 1;
        activeRippleCount.set(target, remaining);
        if (remaining <= 0) {
          const prior = priorStyles.get(target);
          if (prior) {
            target.style.position = prior.position;
            target.style.overflow = prior.overflow;
          }
        }
      }, RIPPLE_DURATION_MS);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return null;
}
