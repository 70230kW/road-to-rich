import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TAB_PATHS, parsePeriod, periodQuery, readRoute, tabUrl } from '../lib/appRoute';
import { mountNavigation, navigate, updateRouteQuery, useNavigation, useUnsavedNavigation } from '../store/useNavigation';

let unmountNavigation: () => void;
beforeEach(() => {
  window.history.replaceState(null, '', '/');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  unmountNavigation = mountNavigation();
});
afterEach(() => { cleanup(); unmountNavigation(); vi.restoreAllMocks(); });

describe('shareable app locations', () => {
  it('maps every screen and keeps the league home separate from TOP', () => {
    for (const [tab, path] of Object.entries(TAB_PATHS)) {
      expect(readRoute(new URL(path, location.origin)).tab).toBe(tab);
      expect(tabUrl(tab, new URL(location.href))).toBe(path);
    }
    expect(readRoute(new URL('/unknown', location.origin)).tab).toBe('top');
    expect(readRoute(new URL('/record?mode=settle', location.origin)).inputMode).toBe('settle');
    expect(readRoute(new URL('/record?mode=invalid', location.origin)).inputMode).toBe('single');
  });
  it('round trips periods and rejects malformed dates', () => {
    for (const value of ['all', 'this-month', 'last-month', 'this-year', '2026', '2026-10']) {
      const parsed = parsePeriod(value);
      expect(periodQuery(parsed.period, parsed.customSeason)).toBe(value);
    }
    for (const value of ['2026-00', '2026-13', '1800', 'junk']) expect(parsePeriod(value).period).toBe('all');
  });
  it('keeps dev fixture navigations and reloads isolated', () => {
    const url = tabUrl('dashboard', new URL('/qa/home-menu.html?flows&fallback', location.origin), new URLSearchParams({ period: '2026-10' }));
    expect(url).toContain('/qa/home-menu.html?');
    expect(readRoute(new URL(url, location.origin)).tab).toBe('dashboard');
    expect(new URL(url, location.origin).searchParams.has('flows')).toBe(true);
  });
  it('restores screen and query on browser back/forward', async () => {
    navigate('dashboard', { period: '2026-10', tab: 'league' });
    updateRouteQuery({ period: 'this-month' });
    navigate('ranking');
    window.history.back();
    await waitFor(() => expect(useNavigation.getState().url).toBe('/dashboard?period=this-month&tab=league'));
    window.history.back();
    await waitFor(() => expect(useNavigation.getState().url).toBe('/dashboard?period=2026-10&tab=league'));
    window.history.forward();
    await waitFor(() => expect(useNavigation.getState().url).toContain('period=this-month'));
  });
  it('cancels button navigation and browser Back without losing forward history', async () => {
    navigate('ranking'); navigate('input');
    function DirtyForm() { useUnsavedNavigation(true); return null; }
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const form = render(<DirtyForm />);
    expect(navigate('home')).toBe(false);
    expect(location.pathname).toBe('/record');
    window.history.back();
    await waitFor(() => expect(confirm).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(location.pathname).toBe('/record'));
    expect(useNavigation.getState().url).toBe('/record');
    confirm.mockReturnValue(true);
    window.history.back();
    await waitFor(() => expect(useNavigation.getState().url).toBe('/ranking'));
    act(() => form.unmount());
    window.history.forward();
    await waitFor(() => expect(useNavigation.getState().url).toBe('/record'));
  });
});
