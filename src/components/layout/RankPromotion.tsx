import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useViewContext, useViewPreferences } from '../../store/useViewPreferences';
import { computePlayerRankStatuses, type PlayerRankStatus } from '../../lib/rankLevel';
import { RankEmblem } from '../common/RankEmblem';
export function RankPromotion() {
  const { room, activeId } = useViewContext();
  const history = useAppStore(s => s.history);
  const players = useAppStore(s => s.players);
  const synced = useAppStore(s => s.connectionStatus === 'synced');
  const status = useMemo(() => computePlayerRankStatuses(history, players)[activeId], [history, players, activeId]);
  const [promotion, setPromotion] = useState<{ room: string; id: string; status: PlayerRankStatus } | null>(null);
  useEffect(() => {
    if (!synced || !status) return;
    const store = useViewPreferences.getState();
    const seen = store.rooms[room]?.seenRanks ?? {};
    const previous = seen[activeId];
    if (previous !== undefined && status.levelIndex > previous) setPromotion({ room, id: activeId, status });
    if (previous !== status.levelIndex) store.update(room, { seenRanks: { ...seen, [activeId]: status.levelIndex } });
  }, [synced, status, room, activeId]);
  if (!promotion || promotion.room !== room || promotion.id !== activeId || promotion.status.levelIndex !== status?.levelIndex) return null;
  return <div className="promotion-banner" role="status"><RankEmblem status={promotion.status} compact />
    <div><p className="eyebrow">RANK UP</p><strong>{players.find(p => p.id === activeId)?.name}、{promotion.status.levelName}に昇段！</strong><small>通算の場代抜き収支で新しい段位に到達しました。</small></div>
    <button type="button" aria-label="昇段のお知らせを閉じる" onClick={() => setPromotion(null)}><X size={18} /></button>
  </div>;
}
