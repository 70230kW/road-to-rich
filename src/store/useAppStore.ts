import { create } from 'zustand';
import type { CustomTrophyDef, DayRecord, Game, LeagueSeason, MatchSession, Player, PlayerCount, PlayerGoal, Settings, YakumanEvent } from '../types';
import { defaultSettings } from '../lib/defaults';
import { ensureAnonymousAuth } from '../lib/firebase';
import { ensurePlayerColors, pickPlayerColor } from '../lib/playerColors';
import {
  deleteDay as deleteDayRepo,
  ensureRoomInitialized,
  finalizeDay as finalizeDayRepo,
  saveCurrentDay,
  saveCustomTrophies,
  saveCurrentSession,
  saveGoals,
  savePlayers,
  saveSettings,
  saveSeasons,
  subscribeCurrentDay,
  subscribeCustomTrophies,
  subscribeGoals,
  subscribeHistory,
  subscribePlayers,
  subscribeSettings,
  subscribeSeasons,
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
  currentSession: MatchSession | null;
  history: DayRecord[];
  goals: Record<string, PlayerGoal>;
  customTrophies: CustomTrophyDef[];
  seasons: LeagueSeason[];
  activeSeasonId: string | null;

  _unsubscribeAll: (() => void) | null;

  connectToRoom: (roomCode: string) => Promise<void>;
  leaveRoom: () => void;

  addPlayer: (name: string) => Promise<void>;
  updatePlayer: (id: string, name: string) => Promise<void>;
  setPlayerColor: (id: string, color: string) => Promise<void>;
  removePlayer: (id: string) => Promise<void>;

  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  setPlayerCount: (count: PlayerCount) => Promise<void>;

  addGame: (game: Omit<Game, 'id'>) => Promise<string | undefined>;
  removeGame: (gameId: string) => Promise<void>;
  updateGameYakuman: (gameId: string, yakumanEvents: YakumanEvent[]) => Promise<void>;

  finalizeDay: (day: Omit<DayRecord, 'id' | 'date'>) => Promise<void>;
  updateDay: (dayId: string, patch: Omit<DayRecord, 'id' | 'date'>) => Promise<void>;
  deleteDay: (dayId: string) => Promise<void>;

  setPlayerGoal: (playerId: string, goal: PlayerGoal | null) => Promise<void>;
  addCustomTrophy: (trophy: Omit<CustomTrophyDef, 'id'>) => Promise<void>;
  removeCustomTrophy: (trophyId: string) => Promise<void>;
  startSession: (title: string, participantIds: string[]) => Promise<void>;
  clearSession: () => Promise<void>;
  createSeason: (name: string, startDate: string) => Promise<void>;
  archiveSeason: (seasonId: string, endDate: string) => Promise<void>;
  setActiveSeason: (seasonId: string | null) => Promise<void>;
}

export const useAppStore = create<AppState>()((set, get) => ({
  roomCode: null,
  connectionStatus: 'idle',
  connectionError: null,

  players: [],
  settings: defaultSettings,
  currentDayGames: [],
  currentSession: null,
  history: [],
  goals: {},
  customTrophies: [],
  seasons: [],
  activeSeasonId: null,

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
      currentSession: null,
      history: [],
      goals: {},
      customTrophies: [],
      seasons: [],
      activeSeasonId: null,
    });

    try {
      await ensureAnonymousAuth();

      // Only mark "synced" once every slice has delivered its first snapshot.
      const pending = new Set(['players', 'settings', 'currentDay', 'history', 'goals', 'customTrophies', 'seasons']);
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
        subscribeCurrentDay(roomCode, ({ games, session }) => {
          set({ currentDayGames: games, currentSession: session });
          markReady('currentDay');
        }),
        subscribeHistory(roomCode, (history) => {
          set({ history });
          markReady('history');
        }),
        subscribeGoals(roomCode, (goals) => {
          set({ goals });
          markReady('goals');
        }),
        subscribeCustomTrophies(roomCode, (customTrophies) => {
          set({ customTrophies });
          markReady('customTrophies');
        }),
        subscribeSeasons(roomCode, ({ list, activeId }) => {
          set({ seasons: list, activeSeasonId: activeId });
          markReady('seasons');
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
      currentSession: null,
      history: [],
      goals: {},
      customTrophies: [],
      seasons: [],
      activeSeasonId: null,
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
    const id = uid();
    await saveCurrentDay(roomCode, [...currentDayGames, { ...game, id }]);
    return id;
  },

  removeGame: async (gameId) => {
    const { roomCode, currentDayGames } = get();
    if (!roomCode) return;
    await saveCurrentDay(
      roomCode,
      currentDayGames.filter((g) => g.id !== gameId),
    );
  },

  updateGameYakuman: async (gameId, yakumanEvents) => {
    const { roomCode, currentDayGames } = get();
    if (!roomCode) return;
    await saveCurrentDay(
      roomCode,
      currentDayGames.map((g) => {
        if (g.id !== gameId) return g;
        const { yakumanEvents: _omit, ...rest } = g;
        return { ...rest, ...(yakumanEvents.length > 0 ? { yakumanEvents } : {}) };
      }),
    );
  },

  finalizeDay: async (day) => {
    const { roomCode, currentSession, activeSeasonId } = get();
    if (!roomCode) return;
    await finalizeDayRepo(roomCode, {
      ...day,
      date: new Date().toISOString(),
      ...(currentSession ? { session: currentSession } : {}),
      ...(activeSeasonId ? { seasonId: activeSeasonId } : {}),
    });
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

  setPlayerGoal: async (playerId, goal) => {
    const { roomCode, goals } = get();
    if (!roomCode) return;
    const next = { ...goals };
    if (goal) next[playerId] = goal;
    else delete next[playerId];
    await saveGoals(roomCode, next);
  },

  addCustomTrophy: async (trophy) => {
    const { roomCode, customTrophies } = get();
    if (!roomCode) return;
    await saveCustomTrophies(roomCode, [...customTrophies, { ...trophy, id: uid() }]);
  },

  removeCustomTrophy: async (trophyId) => {
    const { roomCode, customTrophies } = get();
    if (!roomCode) return;
    await saveCustomTrophies(
      roomCode,
      customTrophies.filter((t) => t.id !== trophyId),
    );
  },

  startSession: async (title, participantIds) => {
    const { roomCode } = get();
    if (!roomCode || !title.trim()) return;
    await saveCurrentSession(roomCode, {
      id: uid(),
      title: title.trim(),
      participantIds,
      startedAt: new Date().toISOString(),
    });
  },

  clearSession: async () => {
    const { roomCode } = get();
    if (!roomCode) return;
    await saveCurrentSession(roomCode, null);
  },

  createSeason: async (name, startDate) => {
    const { roomCode, seasons } = get();
    if (!roomCode || !name.trim()) return;
    const id = uid();
    const next = seasons.map((season) => season.status === 'active'
      ? { ...season, status: 'archived' as const, endDate: startDate, archivedAt: new Date().toISOString() }
      : season);
    next.push({ id, name: name.trim(), startDate, status: 'active', createdAt: new Date().toISOString() });
    await saveSeasons(roomCode, { list: next, activeId: id });
  },

  archiveSeason: async (seasonId, endDate) => {
    const { roomCode, seasons, activeSeasonId } = get();
    if (!roomCode) return;
    await saveSeasons(roomCode, {
      list: seasons.map((season) => season.id === seasonId
        ? { ...season, status: 'archived' as const, endDate, archivedAt: new Date().toISOString() }
        : season),
      activeId: activeSeasonId === seasonId ? null : activeSeasonId,
    });
  },

  setActiveSeason: async (seasonId) => {
    const { roomCode, seasons } = get();
    if (!roomCode) return;
    await saveSeasons(roomCode, { list: seasons, activeId: seasonId });
  },
}));
