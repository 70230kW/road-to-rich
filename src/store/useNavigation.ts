import { useLayoutEffect, useRef } from 'react';
import { create } from 'zustand';
import { readRoute, tabUrl } from '../lib/appRoute';

const blockers = new Map<symbol, string>();
let currentIndex = 0;
let restoring = false;
const locationUrl = () => window.location.pathname + window.location.search;
export const useNavigation = create<{ url: string }>(() => ({ url: locationUrl() }));
export function confirmNavigation() {
  const message = blockers.values().next().value;
  return !message || window.confirm(message);
}
export function navigate(tab: string, query: Record<string, string> = {}) {
  const next = tabUrl(tab, new URL(window.location.href), new URLSearchParams(query));
  return commitUrl(next);
}
export function updateRouteQuery(patch: Record<string, string | null>, replace = false) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) url.searchParams.delete(key); else url.searchParams.set(key, value);
  }
  return commitUrl(url.pathname + url.search, replace);
}
function commitUrl(next: string, replace = false) {
  if (next === locationUrl()) return true;
  if (!replace && !confirmNavigation()) return false;
  if (!replace) currentIndex += 1;
  window.history[replace ? 'replaceState' : 'pushState']({ ...window.history.state, jankaneIndex: currentIndex }, '', next);
  useNavigation.setState({ url: locationUrl() });
  return true;
}
/** One listener owned by AppShell; no router or Firebase coupling. */
export function mountNavigation() {
  currentIndex = window.history.state?.jankaneIndex ?? 0;
  window.history.replaceState({ ...window.history.state, jankaneIndex: currentIndex }, '');
  useNavigation.setState({ url: locationUrl() });
  const pop = () => {
    if (restoring) { restoring = false; return; }
    const targetIndex = window.history.state?.jankaneIndex ?? 0;
    if (!confirmNavigation()) {
      const delta = currentIndex - targetIndex;
      if (delta) { restoring = true; window.history.go(delta); }
      else window.history.replaceState({ jankaneIndex: currentIndex }, '', useNavigation.getState().url);
      return;
    }
    currentIndex = targetIndex;
    useNavigation.setState({ url: locationUrl() });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const unload = (event: BeforeUnloadEvent) => {
    if (!blockers.size) return;
    event.preventDefault(); event.returnValue = '';
  };
  window.addEventListener('popstate', pop);
  window.addEventListener('beforeunload', unload);
  return () => { window.removeEventListener('popstate', pop); window.removeEventListener('beforeunload', unload); };
}
export function useAppRoute() {
  const url = useNavigation(s => s.url);
  return readRoute(new URL(url, window.location.origin));
}
export function useUnsavedNavigation(dirty: boolean, message = '未保存の入力があります。画面を移動しますか？') {
  const token = useRef(Symbol('form'));
  useLayoutEffect(() => {
    const id = token.current;
    if (dirty) blockers.set(id, message); else blockers.delete(id);
    return () => { blockers.delete(id); };
  }, [dirty, message]);
  return () => { blockers.delete(token.current); };
}
