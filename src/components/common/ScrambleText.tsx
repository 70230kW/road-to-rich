import { useEffect, useRef, useState } from 'react';

const NUMBER_TOKEN = /-?\d[\d,]*(?:\.\d+)?/g;
const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

function formatProgressValue(token: string, progress: number) {
  const target = Number(token.replaceAll(',', ''));
  if (!Number.isFinite(target)) return token;
  const decimals = token.includes('.') ? token.split('.')[1].length : 0;
  const current = progress === 0 ? 0 : target * easeOutCubic(progress);
  const normalized = Math.abs(current) < Math.pow(10, -decimals) / 2 ? 0 : current;
  if (token.includes(',')) {
    return normalized.toLocaleString('ja-JP', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return decimals > 0 ? normalized.toFixed(decimals) : String(Math.round(normalized));
}

function renderProgress(text: string, progress: number) {
  return text.replace(NUMBER_TOKEN, (token) => formatProgressValue(token, progress));
}

/** Counts every numeric token from zero to its exact value when the rendered value changes. */
export function ScrambleText({ text, className = '', duration = 700 }: { text: string; className?: string; duration?: number }) {
  const [display, setDisplay] = useState(text);
  const previous = useRef(text);

  useEffect(() => {
    if (previous.current === text || !window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      previous.current = text;
      setDisplay(text);
      return;
    }
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      if (progress === 1) {
        previous.current = text;
        setDisplay(text);
        return;
      }
      setDisplay(renderProgress(text, progress));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, text]);

  return <span className={`scramble-text ${className}`} aria-label={text}>{display}</span>;
}
