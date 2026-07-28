import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DayRecord, Game, Player, PlayerCount, Settings } from '../types';
import { defaultRankPoints } from '../lib/calc';

function uid(): string {
  return crypto.randomUUID();
}

export const defaultSettings: Settings = {
  playerCount: 4,
  initialScore: 25000,
  chipValue: 100,
  divider: 10,
  rankPoints4: defaultRankPoints(4) as [number, number, number, number],
  rankPoints3: [...defaultRankPoints(3), 0].slice(0, 3) as [number, number, number],
};

interface AppState {
  players: Player[];
  settings: Settings;
  currentDayGames: Game[];
  history: DayRecord[];

  addPlayer: (name: string) => void;
  updatePlayer: (id: string, name: string) => void;
  removePlayer: (id: string) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  setPlayerCount: (count: PlayerCount) => void;

  addGame: (game: Omit<Game, 'id'>) => void;
  removeGame: (gameId: string) => void;

  finalizeDay: (day: Omit<DayRecord, 'id' | 'date'>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      players: [],
      settings: defaultSettings,
      currentDayGames: [],
      history: [],

      addPlayer: (name) =>
        set((state) => ({
          players: [...state.players, { id: uid(), name: name.trim() }],
        })),

      updatePlayer: (id, name) =>
        set((state) => ({
          players: state.players.map((p) => (p.id === id ? { ...p, name: name.trim() } : p)),
        })),

      removePlayer: (id) =>
        set((state) => ({
          players: state.players.filter((p) => p.id !== id),
        })),

      updateSettings: (patch) =>
        set((state) => ({
          settings: { ...state.settings, ...patch },
        })),

      setPlayerCount: (count) =>
        set((state) => ({
          settings: { ...state.settings, playerCount: count },
        })),

      addGame: (game) =>
        set((state) => ({
          currentDayGames: [...state.currentDayGames, { ...game, id: uid() }],
        })),

      removeGame: (gameId) =>
        set((state) => ({
          currentDayGames: state.currentDayGames.filter((g) => g.id !== gameId),
        })),

      finalizeDay: (day) =>
        set((state) => ({
          history: [...state.history, { ...day, id: uid(), date: new Date().toISOString() }],
          currentDayGames: [],
        })),
    }),
    {
      name: 'road-to-rich-store',
      version: 1,
    },
  ),
);
