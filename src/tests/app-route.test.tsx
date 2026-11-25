import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TAB_PATHS, parsePeriod, periodQuery, readRoute, tabUrl } from '../lib/appRoute';
import { mountNavigation, navigate, updateRouteQuery, useAppRoute, useNavigation, useUnsavedNavigation } from '../store/useNavigation';

import { PeriodFilter } from '../components/common/PeriodFilter';
import { useAppStore } from '../store/useAppStore';
import { useViewPreferences } from '../store/useViewPreferences';

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


describe('period navigation recovery', () => {
  beforeEach(() => {
    useAppStore.setState({ roomCode: 'route-test', history: [] });
    useViewPreferences.setState({ rooms: {} });
  });
  it('reopens a custom month directly from its label, including a shared URL', () => {
    navigate('ranking', { period: '2026-10' });
    render(<PeriodFilter />);
    fireEvent.click(screen.getByRole('button', { name: '年月を変更（2026年10月）' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'シーズンを選択' }), { target: { value: '2026:9' } });
    expect(screen.queryByRole('combobox', { name: 'シーズンを選択' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '年月を変更（2026年9月）' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'シーズンを選択' }), { target: { value: '2026:8' } });
    expect(location.search).toBe('?period=2026-08');
  });
  it('keeps periods across screens while explicit links and browser Back take priority', async () => {
    function Screens() {
      const { tab } = useAppRoute();
      return tab === 'ranking' || tab === 'dashboard' ? <PeriodFilter /> : null;
    }
    navigate('ranking');
    render(<Screens />);
    fireEvent.click(screen.getByRole('button', { name: '今月' }));
    act(() => { navigate('home'); });
    act(() => { navigate('dashboard'); });
    expect(location.search).toBe('?period=this-month');
    expect(screen.getByRole('button', { name: '今月' })).toHaveAttribute('aria-pressed', 'true');
    act(() => { navigate('ranking', { period: '2026-10' }); });
    expect(screen.getByRole('button', { name: '年月を変更（2026年10月）' })).toBeInTheDocument();
    act(() => { navigate('home'); });
    act(() => { navigate('dashboard'); });
    expect(location.search).toBe('?period=2026-10');
    fireEvent.click(screen.getByRole('button', { name: '通算' }));
    window.history.back();
    await waitFor(() => expect(screen.getByRole('button', { name: '年月を変更（2026年10月）' })).toBeInTheDocument());
    expect(useViewPreferences.getState().rooms['route-test'].period).toBe('custom');
  });
});
