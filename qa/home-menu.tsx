// Dev-only, isolated UI fixture. Not an entry in the production build.
// Every store action is replaced before mounting: no Firebase reads or writes.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from '../src/App';
import { useAppStore, defaultSettings } from '../src/store/useAppStore';
import '../src/index.css';
import '../src/styles/experience.css';

if (!import.meta.env.DEV) throw new Error('UI fixture is development-only');
const store = useAppStore;
const state = store.getState();
const disabled = Object.fromEntries(Object.entries(state).filter(([, value]) => typeof value === 'function').map(([key]) => [key, async () => { throw new Error('検証画面のため、この操作は保存されません。'); }]));
store.setState({ ...disabled, roomCode: 'UI-PREVIEW-NO-SAVE', connectionStatus: 'synced', players: [
  { id: 'qa-a', name: 'テスト雀士A', color: '#d9bd82' },
  { id: 'qa-b', name: 'テスト雀士B', color: '#68d5a3' },
  { id: 'qa-c', name: '長い名前のテスト雀士C', color: '#72a7d9' },
  { id: 'qa-d', name: 'テスト雀士D', color: '#d97878' },
], settings: defaultSettings, currentSession: { id: 'qa-session', title: '進行中の対局（検証データ）', participantIds: ['qa-a', 'qa-b', 'qa-c', 'qa-d'], startedAt: '2026-10-29T00:00:00Z' },
  currentDayGames: [], history: [],
  addGame: async game => { const id = crypto.randomUUID(); store.setState(s => ({ currentDayGames: [...s.currentDayGames, { ...game, id }] })); return id; },
  removeGame: async id => { store.setState(s => ({ currentDayGames: s.currentDayGames.filter(game => game.id !== id) })); },
  clearSession: async () => { store.setState({ currentSession: null }); },
  refreshRoom: async () => {},
});
localStorage.setItem('road-to-rich-welcome-v1', 'seen');
const params = new URLSearchParams(location.search);
if (params.has('fallback')) Object.defineProperty(window, 'WebGL2RenderingContext', { value: undefined, configurable: true });
if (params.has('reduced')) {
  const match = window.matchMedia.bind(window);
  window.matchMedia = query => {
    const result = match(query);
    if (query.includes('prefers-reduced-motion')) Object.defineProperty(result, 'matches', { value: true });
    return result;
  };
}
createRoot(document.getElementById('root')!).render(<StrictMode><div style={{ padding: 8, background: '#343124', color: '#edddb2', textAlign: 'center', fontSize: 12 }}>UI検証専用 · 本番への保存・接続なし</div><AppShell /></StrictMode>);
