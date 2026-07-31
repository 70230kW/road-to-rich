import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { defaultSettings } from './defaults';
import type { DayRecord, Game, Player, Settings } from '../types';

const PLAYERS_PATH = ['state', 'players'] as const;
const SETTINGS_PATH = ['state', 'settings'] as const;
const CURRENT_DAY_PATH = ['state', 'currentDay'] as const;

function roomDoc(roomCode: string, segments: readonly string[]) {
  return doc(getFirebaseDb(), 'rooms', roomCode, ...segments);
}

function historyCollection(roomCode: string) {
  return collection(getFirebaseDb(), 'rooms', roomCode, 'history');
}

function historyDoc(roomCode: string, dayId: string) {
  return doc(getFirebaseDb(), 'rooms', roomCode, 'history', dayId);
}

/** Seeds a room's state docs with defaults the first time it's ever entered. */
export async function ensureRoomInitialized(roomCode: string): Promise<void> {
  const settingsRef = roomDoc(roomCode, SETTINGS_PATH);
  const existing = await getDoc(settingsRef);
  if (existing.exists()) return;

  await Promise.all([
    setDoc(settingsRef, defaultSettings),
    setDoc(roomDoc(roomCode, PLAYERS_PATH), { list: [] as Player[] }),
    setDoc(roomDoc(roomCode, CURRENT_DAY_PATH), { games: [] as Game[] }),
  ]);
}

export function subscribePlayers(roomCode: string, cb: (players: Player[]) => void): Unsubscribe {
  return onSnapshot(roomDoc(roomCode, PLAYERS_PATH), (snap) => {
    const data = snap.data() as { list?: Player[] } | undefined;
    cb(data?.list ?? []);
  });
}

export function subscribeSettings(roomCode: string, cb: (settings: Settings) => void): Unsubscribe {
  return onSnapshot(roomDoc(roomCode, SETTINGS_PATH), (snap) => {
    cb((snap.data() as Settings | undefined) ?? defaultSettings);
  });
}

export function subscribeCurrentDay(roomCode: string, cb: (games: Game[]) => void): Unsubscribe {
  return onSnapshot(roomDoc(roomCode, CURRENT_DAY_PATH), (snap) => {
    const data = snap.data() as { games?: Game[] } | undefined;
    cb(data?.games ?? []);
  });
}

export function subscribeHistory(roomCode: string, cb: (history: DayRecord[]) => void): Unsubscribe {
  const q = query(historyCollection(roomCode), orderBy('date', 'asc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DayRecord, 'id'>) })));
  });
}

export async function savePlayers(roomCode: string, players: Player[]): Promise<void> {
  await setDoc(roomDoc(roomCode, PLAYERS_PATH), { list: players });
}

export async function saveSettings(roomCode: string, settings: Settings): Promise<void> {
  await setDoc(roomDoc(roomCode, SETTINGS_PATH), settings);
}

export async function saveCurrentDay(roomCode: string, games: Game[]): Promise<void> {
  await setDoc(roomDoc(roomCode, CURRENT_DAY_PATH), { games });
}

export async function finalizeDay(roomCode: string, day: Omit<DayRecord, 'id'>): Promise<void> {
  await addDoc(historyCollection(roomCode), day);
  await saveCurrentDay(roomCode, []);
}

export async function updateDay(roomCode: string, dayId: string, patch: Omit<DayRecord, 'id' | 'date'>): Promise<void> {
  await updateDoc(historyDoc(roomCode, dayId), patch);
}

export async function deleteDay(roomCode: string, dayId: string): Promise<void> {
  await deleteDoc(historyDoc(roomCode, dayId));
}
