import { useMemo } from 'react';
import { create } from 'zustand';
import { useAppStore } from './useAppStore';
import type { SeasonFilter } from '../lib/season';

export type PeriodChoice = 'month' | 'previousMonth' | 'year' | 'all' | 'custom';
interface ViewPreference { playerId: string; period: PeriodChoice; customSeason: SeasonFilter; seenRanks: Record<string, number>; }
const DEFAULT: ViewPreference = { playerId: '', period: 'all', customSeason: 'all', seenRanks: {} };
export const VIEW_STORAGE_KEY = 'road-to-rich-view-preferences-v1';
export function validSeason(value: unknown): value is SeasonFilter {
  if (value === 'all') return true;
  if (!value || typeof value !== 'object') return false;
  const v = value as { year: number; month: number | 'all' };
  return Number.isInteger(v.year) && v.year >= 1900 && v.year <= 9999 &&
    (v.month === 'all' || (Number.isInteger(v.month) && v.month >= 1 && v.month <= 12));
}
export function readViewPreferences(): Record<string, ViewPreference> {
  try {
    const parsed = JSON.parse(localStorage.getItem(VIEW_STORAGE_KEY) ?? '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).flatMap(([key, raw]) => {
      if (!raw || typeof raw !== 'object') return [];
      const v = raw as ViewPreference;
      if (typeof v.playerId !== 'string' || !['month','previousMonth','year','all','custom'].includes(v.period) || !validSeason(v.customSeason)) return [];
      const seenRanks = Object.fromEntries(Object.entries(v.seenRanks ?? {}).filter(([, rank]) => Number.isInteger(rank) && rank >= 0 && rank < 16));
      return [[key, { ...DEFAULT, playerId: v.playerId, period: v.period, customSeason: v.customSeason, seenRanks }]];
    }));
  } catch { return {}; }
}
export function resolvePeriod(period: PeriodChoice, custom: SeasonFilter, now = new Date()): SeasonFilter {
  if (period === 'all') return 'all';
  if (period === 'custom') return custom;
  if (period === 'year') return { year: now.getFullYear(), month: 'all' };
  const date = period === 'previousMonth' ? new Date(now.getFullYear(), now.getMonth() - 1, 1) : now;
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}
interface ViewState {
  rooms: Record<string, ViewPreference>;
  update: (room: string, patch: Partial<ViewPreference>) => void;
}
export const useViewPreferences = create<ViewState>((set, get) => ({
  rooms: readViewPreferences(),
  update: (room, patch) => {
    const rooms = { ...get().rooms, [room]: { ...(get().rooms[room] ?? DEFAULT), ...patch } };
    set({ rooms });
    try { localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(rooms)); } catch { /* Session choices still work if storage is unavailable. */ }
  },
}));
export function useViewContext() {
  const room = useAppStore(s => s.roomCode) ?? '__local__';
  const players = useAppStore(s => s.players);
  const preference = useViewPreferences(s => s.rooms[room] ?? DEFAULT);
  const update = useViewPreferences(s => s.update);
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const season = useMemo(() => resolvePeriod(preference.period, preference.customSeason, new Date(year, month, 1)), [preference.period, preference.customSeason, year, month]);
  const activeId = players.some(p => p.id === preference.playerId) ? preference.playerId : players[0]?.id ?? '';
  return { room, activeId, season, period: preference.period,
    setPlayerId: (playerId: string) => update(room, { playerId }),
    setSeason: (customSeason: SeasonFilter) => update(room, { customSeason, period: customSeason === 'all' ? 'all' : 'custom' }),
    setPeriod: (period: PeriodChoice) => update(room, { period }),
  };
}
