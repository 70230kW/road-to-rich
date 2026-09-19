import { useEffect, useRef, useState } from 'react';

const DIGIT = /\d/;

/** Briefly scrambles digits whenever the rendered value changes, then lands on the exact value. */
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
      setDisplay(Array.from(text, (char) => DIGIT.test(char) ? String(Math.floor(Math.random() * 10)) : char).join(''));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, text]);

  return <span className={`scramble-text ${className}`} aria-label={text}>{display}</span>;
}
