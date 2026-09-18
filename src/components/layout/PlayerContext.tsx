import { useAppStore } from '../../store/useAppStore';
import { useViewContext } from '../../store/useViewPreferences';

export function PlayerContext() {
  const players = useAppStore(s => s.players);
  const { activeId, setPlayerId } = useViewContext();
  return <label className="header-player-select">
    <span>自分の名前を選択してください</span>
    <select aria-label="自分の名前を選択してください" value={activeId} disabled={!players.length} onChange={e => setPlayerId(e.target.value)}>
      {!players.length && <option value="">雀士を登録してください</option>}
      {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  </label>;
}
