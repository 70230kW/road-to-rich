import { create } from 'zustand';
import type { DayRecord, Game, Player, PlayerCount, Settings } from '../types';
import { defaultSettings } from '../lib/defaults';
import { ensureAnonymousAuth } from '../lib/firebase';
import { ensurePlayerColors, pickPlayerColor } from '../lib/playerColors';
import {
  deleteDay as deleteDayRepo,
  ensureRoomInitialized,
  finalizeDay as finalizeDayRepo,
  saveCurrentDay,
  savePlayers,
  saveSettings,
  subscribeCurrentDay,
  subscribeHistory,
  subscribePlayers,
  subscribeSettings,
  updateDay as updateDayRepo,
} from '../lib/roomRepo';

export { defaultSettings };

const ROOM_CODE_STORAGE_KEY = 'road-to-rich-room-code';

function uid(): string {
  return crypto.randomUUID();
}

export function getSavedRoomCode(): string | null {
  return localStorage.getItem(ROOM_CODE_STORAGE_KEY);
}

export type ConnectionStatus = 'idle' | 'connecting' | 'synced' | 'error';

interface AppState {
  roomCode: string | null;
  connectionStatus: ConnectionStatus;
  connectionError: string | null;

  players: Player[];
  settings: Settings;
  currentDayGames: Game[];
  history: DayRecord[];

  _unsubscribeAll: (() => void) | null;

  connectToRoom: (roomCode: string) => Promise<void>;
  leaveRoom: () => void;

  addPlayer: (name: string) => Promise<void>;
  updatePlayer: (id: string, name: string) => Promise<void>;
  setPlayerColor: (id: string, color: string) => Promise<void>;
  removePlayer: (id: string) => Promise<void>;

  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  setPlayerCount: (count: PlayerCount) => Promise<void>;

  addGame: (game: Omit<Game, 'id'>) => Promise<void>;
  removeGame: (gameId: string) => Promise<void>;

  finalizeDay: (day: Omit<DayRecord, 'id' | 'date'>) => Promise<void>;
  updateDay: (dayId: string, patch: Omit<DayRecord, 'id' | 'date'>) => Promise<void>;
  deleteDay: (dayId: string) => Promise<void>;
}

export const useAppStore = create<AppState>()((set, get) => ({
  roomCode: null,
  connectionStatus: 'idle',
  connectionError: null,

  players: [],
  settings: defaultSettings,
  currentDayGames: [],
  history: [],

  _unsubscribeAll: null,

  connectToRoom: async (roomCode) => {
    get()._unsubscribeAll?.();
    set({
      roomCode,
      connectionStatus: 'connecting',
      connectionError: null,
      players: [],
      settings: defaultSettings,
      currentDayGames: [],
      history: [],
    });

    try {
      await ensureAnonymousAuth();

      // Only mark "synced" once every slice has delivered its first snapshot.
      const pending = new Set(['players', 'settings', 'currentDay', 'history']);
      const markReady = (slice: string) => {
        pending.delete(slice);
        if (pending.size === 0 && get().roomCode === roomCode) {
          set({ connectionStatus: 'synced' });
        }
      };

      const unsubs = [
        subscribePlayers(roomCode, (players) => {
          const healed = ensurePlayerColors(players);
          set({ players: healed });
          markReady('players');
          // Pre-existing rooms may have players saved before `color` existed;
          // persist the backfilled colors so every client converges on them.
          if (healed.some((p, i) => p.color !== players[i]?.color)) {
            savePlayers(roomCode, healed).catch((err) => {
              console.error('Failed to backfill missing player colors:', err);
            });
          }
        }),
        subscribeSettings(roomCode, (settings) => {
          set({ settings });
          markReady('settings');
        }),
        subscribeCurrentDay(roomCode, (currentDayGames) => {
          set({ currentDayGames });
          markReady('currentDay');
        }),
        subscribeHistory(roomCode, (history) => {
          set({ history });
          markReady('history');
        }),
      ];
      set({ _unsubscribeAll: () => unsubs.forEach((u) => u()) });
      localStorage.setItem(ROOM_CODE_STORAGE_KEY, roomCode);

      // Seeding defaults only matters for a brand-new room; the listeners
      // above already stream real data for existing ones, so this runs
      // in the background instead of blocking the first render on it.
      ensureRoomInitialized(roomCode).catch((err) => {
        console.error('Failed to seed default room state:', err);
      });
    } catch (err) {
      set({ connectionStatus: 'error', connectionError: err instanceof Error ? err.message : String(err) });
    }
  },

  leaveRoom: () => {
    get()._unsubscribeAll?.();
    localStorage.removeItem(ROOM_CODE_STORAGE_KEY);
    set({
      roomCode: null,
      connectionStatus: 'idle',
      connectionError: null,
      players: [],
      settings: defaultSettings,
      currentDayGames: [],
      history: [],
      _unsubscribeAll: null,
    });
  },

  addPlayer: async (name) => {
    const { roomCode, players } = get();
    if (!roomCode || !name.trim()) return;
    const color = pickPlayerColor(players.map((p) => p.color));
    await savePlayers(roomCode, [...players, { id: uid(), name: name.trim(), color }]);
  },

  updatePlayer: async (id, name) => {
    const { roomCode, players } = get();
    if (!roomCode || !name.trim()) return;
    await savePlayers(
      roomCode,
      players.map((p) => (p.id === id ? { ...p, name: name.trim() } : p)),
    );
  },

  setPlayerColor: async (id, color) => {
    const { roomCode, players } = get();
    if (!roomCode) return;
    await savePlayers(
      roomCode,
      players.map((p) => (p.id === id ? { ...p, color } : p)),
    );
  },

  removePlayer: async (id) => {
    const { roomCode, players } = get();
    if (!roomCode) return;
    await savePlayers(
      roomCode,
      players.filter((p) => p.id !== id),
    );
  },

  updateSettings: async (patch) => {
    const { roomCode, settings } = get();
    if (!roomCode) return;
    await saveSettings(roomCode, { ...settings, ...patch });
  },

  setPlayerCount: async (count) => {
    await get().updateSettings({ playerCount: count });
  },

  addGame: async (game) => {
    const { roomCode, currentDayGames } = get();
    if (!roomCode) return;
    await saveCurrentDay(roomCode, [...currentDayGames, { ...game, id: uid() }]);
  },

  removeGame: async (gameId) => {
    const { roomCode, currentDayGames } = get();
    if (!roomCode) return;
    await saveCurrentDay(
      roomCode,
      currentDayGames.filter((g) => g.id !== gameId),
    );
  },

  finalizeDay: async (day) => {
    const { roomCode } = get();
    if (!roomCode) return;
    await finalizeDayRepo(roomCode, { ...day, date: new Date().toISOString() });
  },

  updateDay: async (dayId, patch) => {
    const { roomCode } = get();
    if (!roomCode) return;
    await updateDayRepo(roomCode, dayId, patch);
  },

  deleteDay: async (dayId) => {
    const { roomCode } = get();
    if (!roomCode) return;
    await deleteDayRepo(roomCode, dayId);
  },
}));
