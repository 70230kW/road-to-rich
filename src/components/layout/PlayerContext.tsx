import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useViewContext } from '../../store/useViewPreferences';
import { computePlayerRankStatuses } from '../../lib/rankLevel';
import { RankEmblem } from '../common/RankEmblem';
export function PlayerContext({ onRank }: { onRank: () => void }) {
  const players = useAppStore(s => s.players);
  const history = useAppStore(s => s.history);
  const { activeId, setPlayerId } = useViewContext();
  const status = useMemo(() => computePlayerRankStatuses(history, players)[activeId], [history,players,activeId]);
  if (!status) return null;
  return <div className="player-context"><RankEmblem status={status} compact />
    <label><span>自分の名前を選択してください · この端末に記憶</span><select aria-label="自分の名前を選択してください" value={activeId} onChange={e => setPlayerId(e.target.value)}>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <button type="button" onClick={onRank}>{status.levelName}<span>段位を見る →</span></button>
  </div>;
}
