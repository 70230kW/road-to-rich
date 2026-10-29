import { useEffect, useState } from 'react';

/** Visual viewport only; never guesses keyboard state from user-agent strings. */
export function useScoreWorkspace(enabled: boolean) {
  const [state, setState] = useState({ focused: false, keyboardInset: 0 });
  useEffect(() => {
    if (!enabled) { setState({ focused: false, keyboardInset: 0 }); return; }
    let frame = 0;
    const viewport = window.visualViewport;
    const update = (reveal = false) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const unzoomed = !viewport || Math.abs(viewport.scale - 1) < .05;
        const inForm = Boolean(active?.closest('[data-score-entry]'));
        const editable = Boolean(active?.matches('input:not([type="range"]):not([type="checkbox"]):not(:disabled), select:not(:disabled)'));
        const inset = viewport && unzoomed ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0;
        // Keep controls above a closing keyboard when focus moves to confirmation.
        const focused = inForm && (editable || inset > 120);
        const keyboardInset = focused ? inset : 0;
        setState(current => current.focused === focused && current.keyboardInset === keyboardInset ? current : { focused, keyboardInset });
        if (focused && editable && reveal && unzoomed && window.innerWidth < 1024) active?.scrollIntoView?.({ block: 'center', behavior: 'instant' });
      });
    };
    const reveal = () => update(true);
    const measure = () => update(false);
    document.addEventListener('focusin', reveal);
    document.addEventListener('focusout', measure);
    viewport?.addEventListener('resize', reveal);
    viewport?.addEventListener('scroll', measure);
    window.addEventListener('resize', measure);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('focusin', reveal);
      document.removeEventListener('focusout', measure);
      viewport?.removeEventListener('resize', reveal);
      viewport?.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [enabled]);
  return enabled ? state : { focused: false, keyboardInset: 0 };
}
