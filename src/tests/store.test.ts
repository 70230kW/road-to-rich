import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  ensureAnonymousAuth: vi.fn(),
  ensureRoomInitialized: vi.fn(),
  savePlayers: vi.fn(),
  saveSettings: vi.fn(),
  saveCurrentDay: vi.fn(),
  finalizeDay: vi.fn(),
  updateDay: vi.fn(),
  deleteDay: vi.fn(),
  playersCb: null as ((players: unknown[]) => void) | null,
  settingsCb: null as ((settings: unknown) => void) | null,
  currentDayCb: null as ((games: unknown[]) => void) | null,
  historyCb: null as ((history: unknown[]) => void) | null,
  unsubscribers: [] as ReturnType<typeof vi.fn>[],
}));

vi.mock('../lib/firebase', () => ({
  ensureAnonymousAuth: mocks.ensureAnonymousAuth,
  isFirebaseConfigured: () => true,
}));

vi.mock('../lib/roomRepo', () => ({
  ensureRoomInitialized: mocks.ensureRoomInitialized,
  subscribePlayers: (_roomCode: string, cb: (players: unknown[]) => void) => {
    mocks.playersCb = cb;
    const unsub = vi.fn();
    mocks.unsubscribers.push(unsub);
    return unsub;
  },
  subscribeSettings: (_roomCode: string, cb: (settings: unknown) => void) => {
    mocks.settingsCb = cb;
    const unsub = vi.fn();
    mocks.unsubscribers.push(unsub);
    return unsub;
  },
  subscribeCurrentDay: (_roomCode: string, cb: (games: unknown[]) => void) => {
    mocks.currentDayCb = cb;
    const unsub = vi.fn();
    mocks.unsubscribers.push(unsub);
    return unsub;
  },
  subscribeHistory: (_roomCode: string, cb: (history: unknown[]) => void) => {
    mocks.historyCb = cb;
    const unsub = vi.fn();
    mocks.unsubscribers.push(unsub);
    return unsub;
  },
  savePlayers: mocks.savePlayers,
  saveSettings: mocks.saveSettings,
  saveCurrentDay: mocks.saveCurrentDay,
  finalizeDay: mocks.finalizeDay,
  updateDay: mocks.updateDay,
  deleteDay: mocks.deleteDay,
}));

const { useAppStore, defaultSettings, getSavedRoomCode } = await import('../store/useAppStore');

function flushInitialSnapshots(overrides: Partial<{ players: unknown[]; settings: unknown; currentDayGames: unknown[]; history: unknown[] }> = {}) {
  mocks.playersCb?.(overrides.players ?? []);
  mocks.settingsCb?.(overrides.settings ?? defaultSettings);
  mocks.currentDayCb?.(overrides.currentDayGames ?? []);
  mocks.historyCb?.(overrides.history ?? []);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.ensureAnonymousAuth.mockResolvedValue('mock-uid');
  mocks.ensureRoomInitialized.mockResolvedValue(undefined);
  mocks.savePlayers.mockResolvedValue(undefined);
  mocks.saveSettings.mockResolvedValue(undefined);
  mocks.saveCurrentDay.mockResolvedValue(undefined);
  mocks.finalizeDay.mockResolvedValue(undefined);
  mocks.updateDay.mockResolvedValue(undefined);
  mocks.deleteDay.mockResolvedValue(undefined);
  mocks.playersCb = null;
  mocks.settingsCb = null;
  mocks.currentDayCb = null;
  mocks.historyCb = null;
  mocks.unsubscribers = [];
  localStorage.clear();
  useAppStore.setState({
    roomCode: null,
    connectionStatus: 'idle',
    connectionError: null,
    players: [],
    settings: defaultSettings,
    currentDayGames: [],
    history: [],
    _unsubscribeAll: null,
  });
});

describe('connectToRoom', () => {
  it('authenticates, seeds the room, and subscribes to every slice', async () => {
    await useAppStore.getState().connectToRoom('neon-tiger-482');
    expect(mocks.ensureAnonymousAuth).toHaveBeenCalled();
    expect(mocks.ensureRoomInitialized).toHaveBeenCalledWith('neon-tiger-482');
    expect(useAppStore.getState().connectionStatus).toBe('connecting');
  });

  it('only flips to "synced" once every slice has delivered its first snapshot', async () => {
    await useAppStore.getState().connectToRoom('room-a');
    mocks.playersCb?.([{ id: 'p1', name: 'Alice' }]);
    expect(useAppStore.getState().connectionStatus).toBe('connecting');
    mocks.settingsCb?.(defaultSettings);
    mocks.currentDayCb?.([]);
    expect(useAppStore.getState().connectionStatus).toBe('connecting');
    mocks.historyCb?.([]);
    expect(useAppStore.getState().connectionStatus).toBe('synced');
    expect(useAppStore.getState().players).toEqual([{ id: 'p1', name: 'Alice' }]);
  });

  it('persists the room code to localStorage so a reload can auto-rejoin', async () => {
    await useAppStore.getState().connectToRoom('room-b');
    expect(getSavedRoomCode()).toBe('room-b');
  });

  it('surfaces auth/init failures as connectionStatus "error"', async () => {
    mocks.ensureAnonymousAuth.mockRejectedValue(new Error('network down'));
    await useAppStore.getState().connectToRoom('room-c');
    expect(useAppStore.getState().connectionStatus).toBe('error');
    expect(useAppStore.getState().connectionError).toContain('network down');
  });
});

describe('leaveRoom', () => {
  it('unsubscribes, clears local state, and forgets the saved room code', async () => {
    await useAppStore.getState().connectToRoom('room-d');
    flushInitialSnapshots({ players: [{ id: 'p1', name: 'Alice' }] });

    useAppStore.getState().leaveRoom();

    expect(mocks.unsubscribers.every((u) => u.mock.calls.length === 1)).toBe(true);
    expect(useAppStore.getState().roomCode).toBeNull();
    expect(useAppStore.getState().players).toEqual([]);
    expect(getSavedRoomCode()).toBeNull();
  });
});

describe('player actions', () => {
  beforeEach(async () => {
    await useAppStore.getState().connectToRoom('room-e');
    flushInitialSnapshots();
  });

  it('addPlayer writes the appended list to Firestore', async () => {
    await useAppStore.getState().addPlayer('Alice');
    expect(mocks.savePlayers).toHaveBeenCalledWith('room-e', [expect.objectContaining({ name: 'Alice' })]);
  });

  it('ignores blank names', async () => {
    await useAppStore.getState().addPlayer('   ');
    expect(mocks.savePlayers).not.toHaveBeenCalled();
  });

  it('updatePlayer writes the renamed list', async () => {
    flushInitialSnapshots({ players: [{ id: 'p1', name: 'Alice' }] });
    await useAppStore.getState().updatePlayer('p1', 'Alicia');
    expect(mocks.savePlayers).toHaveBeenCalledWith('room-e', [{ id: 'p1', name: 'Alicia' }]);
  });

  it('removePlayer writes the filtered list', async () => {
    flushInitialSnapshots({
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
    });
    await useAppStore.getState().removePlayer('p1');
    expect(mocks.savePlayers).toHaveBeenCalledWith('room-e', [{ id: 'p2', name: 'Bob' }]);
  });

  it('reflects a simulated remote snapshot reactively', () => {
    flushInitialSnapshots({ players: [{ id: 'p9', name: 'RemoteAdd' }] });
    expect(useAppStore.getState().players).toEqual([{ id: 'p9', name: 'RemoteAdd' }]);
  });
});

describe('settings actions', () => {
  beforeEach(async () => {
    await useAppStore.getState().connectToRoom('room-f');
    flushInitialSnapshots();
  });

  it('updateSettings merges the patch and writes the full settings doc', async () => {
    await useAppStore.getState().updateSettings({ divider: 20 });
    expect(mocks.saveSettings).toHaveBeenCalledWith('room-f', { ...defaultSettings, divider: 20 });
  });

  it('setPlayerCount updates just the playerCount field', async () => {
    await useAppStore.getState().setPlayerCount(3);
    expect(mocks.saveSettings).toHaveBeenCalledWith('room-f', { ...defaultSettings, playerCount: 3 });
  });
});

describe('game actions', () => {
  beforeEach(async () => {
    await useAppStore.getState().connectToRoom('room-g');
    flushInitialSnapshots();
  });

  const scores = [{ playerId: 'a', rawScore: 58200, rank: 1, point: 6320 }];

  it('addGame appends a game with a generated id', async () => {
    await useAppStore.getState().addGame({ scores });
    expect(mocks.saveCurrentDay).toHaveBeenCalledWith('room-g', [
      expect.objectContaining({ id: expect.any(String), scores }),
    ]);
  });

  it('removeGame filters the game out by id', async () => {
    flushInitialSnapshots({ currentDayGames: [{ id: 'g1', scores }] });
    await useAppStore.getState().removeGame('g1');
    expect(mocks.saveCurrentDay).toHaveBeenCalledWith('room-g', []);
  });

  it('finalizeDay stamps a date and delegates to the repo', async () => {
    const day = { games: [{ id: 'g1', scores }], tableFee: 4000, chips: { a: 0 }, chipRate: 100, settlement: {} };
    await useAppStore.getState().finalizeDay(day);
    expect(mocks.finalizeDay).toHaveBeenCalledWith('room-g', expect.objectContaining({ ...day, date: expect.any(String) }));
  });

  it('updateDay delegates the patch to the repo without touching the date', async () => {
    const patch = { games: [{ id: 'g1', scores }], tableFee: 5000, chips: { a: 1 }, chipRate: 200, settlement: {} };
    await useAppStore.getState().updateDay('day-1', patch);
    expect(mocks.updateDay).toHaveBeenCalledWith('room-g', 'day-1', patch);
  });

  it('deleteDay delegates to the repo', async () => {
    await useAppStore.getState().deleteDay('day-1');
    expect(mocks.deleteDay).toHaveBeenCalledWith('room-g', 'day-1');
  });
});

describe('actions are no-ops without a connected room', () => {
  it('does not call Firestore writers when roomCode is null', async () => {
    await useAppStore.getState().addPlayer('Alice');
    await useAppStore.getState().updateSettings({ divider: 1 });
    await useAppStore.getState().addGame({ scores: [] });
    expect(mocks.savePlayers).not.toHaveBeenCalled();
    expect(mocks.saveSettings).not.toHaveBeenCalled();
    expect(mocks.saveCurrentDay).not.toHaveBeenCalled();
  });
});
