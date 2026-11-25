import type { InputMode } from './inputMode';
import type { PeriodChoice } from '../store/useViewPreferences';
import type { SeasonFilter } from './season';

export const TAB_PATHS = {
  top: '/', home: '/league', ranking: '/ranking', input: '/record', history: '/history',
  dashboard: '/dashboard', rank: '/rank', simulator: '/forecast', trophies: '/achievements',
  seasons: '/season', updates: '/updates', rules: '/rules', players: '/players', settings: '/settings',
} as const;
export type AppTab = keyof typeof TAB_PATHS;
export function readRoute(url: URL) {
  const fixture = url.pathname === '/qa/home-menu.html';
  const candidate = fixture ? url.searchParams.get('screen') : Object.entries(TAB_PATHS).find(([, path]) => path === url.pathname.replace(/\/$/, '') || path === url.pathname)?.[0];
  const tab = candidate && Object.hasOwn(TAB_PATHS, candidate) ? candidate as AppTab : 'top';
  const mode = url.searchParams.get('mode');
  return { tab, params: url.searchParams, inputMode: (mode === 'session' || mode === 'settle' ? mode : 'single') as InputMode };
}
export function tabUrl(tab: string, current: URL, params = new URLSearchParams()) {
  const id = Object.hasOwn(TAB_PATHS, tab) ? tab as AppTab : 'top';
  if (current.pathname === '/qa/home-menu.html') {
    for (const flag of ['quality', 'flows', 'fallback', 'reduced']) {
      if (current.searchParams.has(flag)) params.set(flag, current.searchParams.get(flag) ?? '');
    }
    params.set('screen', id);
    return `/qa/home-menu.html?${params}`;
  }
  return TAB_PATHS[id] + (params.size ? `?${params}` : '');
}
export function parsePeriod(value: string | null): { period: PeriodChoice; customSeason: SeasonFilter } {
  const choices: Record<string, PeriodChoice> = { 'this-month': 'month', 'last-month': 'previousMonth', 'this-year': 'year' };
  if (value && choices[value]) return { period: choices[value], customSeason: 'all' };
  if (value && /^\d{4}(-\d{2})?$/.test(value)) {
    const [year, month] = value.split('-').map(Number);
    if (year >= 1900 && (!month && !value.includes('-') || month >= 1 && month <= 12)) {
      return { period: 'custom', customSeason: { year, month: month ?? 'all' } };
    }
  }
  return { period: 'all', customSeason: 'all' };
}
export function periodQuery(period: PeriodChoice, custom: SeasonFilter) {
  if (period === 'custom' && custom !== 'all') return `${custom.year}${custom.month === 'all' ? '' : `-${String(custom.month).padStart(2, '0')}`}`;
  return { month: 'this-month', previousMonth: 'last-month', year: 'this-year', all: 'all', custom: 'all' }[period];
}
