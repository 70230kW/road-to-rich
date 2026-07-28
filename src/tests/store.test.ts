import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '../store/useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({
      players: [],
      settings: useAppStore.getState().settings,
      currentDayGames: [],
      history: [],
    });
  });

  it('adds, renames, and removes players', () => {
    useAppStore.getState().addPlayer('Alice');
    useAppStore.getState().addPlayer('Bob');
    expect(useAppStore.getState().players.map((p) => p.name)).toEqual(['Alice', 'Bob']);

    const aliceId = useAppStore.getState().players[0].id;
    useAppStore.getState().updatePlayer(aliceId, 'Alicia');
    expect(useAppStore.getState().players[0].name).toBe('Alicia');

    useAppStore.getState().removePlayer(aliceId);
    expect(useAppStore.getState().players.map((p) => p.name)).toEqual(['Bob']);
  });

  it('records and removes games for the current day', () => {
    useAppStore.getState().addGame({
      scores: [
        { playerId: 'a', rawScore: 58200, rank: 1, point: 6320 },
        { playerId: 'b', rawScore: 20000, rank: 2, point: 500 },
        { playerId: 'c', rawScore: 15000, rank: 3, point: -1500 },
        { playerId: 'd', rawScore: 6800, rank: 4, point: -5320 },
      ],
    });
    expect(useAppStore.getState().currentDayGames).toHaveLength(1);
    const gameId = useAppStore.getState().currentDayGames[0].id;
    useAppStore.getState().removeGame(gameId);
    expect(useAppStore.getState().currentDayGames).toHaveLength(0);
  });

  it('finalizes a day into history and clears the working set', () => {
    useAppStore.getState().addGame({
      scores: [{ playerId: 'a', rawScore: 100000, rank: 1, point: 7500 }],
    });
    useAppStore.getState().finalizeDay({
      games: useAppStore.getState().currentDayGames,
      tableFee: 4000,
      chips: { a: 0 },
      settlement: {
        a: {
          gamesTotal: 7500,
          chipCount: 0,
          chipValue: 0,
          tableFeeShare: 4000,
          totalWithoutFee: 7500,
          totalWithFee: 3500,
        },
      },
    });
    expect(useAppStore.getState().currentDayGames).toHaveLength(0);
    expect(useAppStore.getState().history).toHaveLength(1);
    expect(useAppStore.getState().history[0].settlement.a.totalWithFee).toBe(3500);
  });

  it('persists state to localStorage', () => {
    useAppStore.getState().addPlayer('Persisted Player');
    const raw = localStorage.getItem('road-to-rich-store');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).state.players[0].name).toBe('Persisted Player');
  });
});
