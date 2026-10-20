import { Activity } from 'lucide-react';
import { useMemo } from 'react';
import type { Game, GameScore, Player } from '../../types';
import { formatSignedYen } from '../../lib/format';

export function CurrentProfitsBar({
  games,
  players,
  previewScores,
  participantIds,
}: {
  games: Game[];
  players: Player[];
  previewScores?: GameScore[] | null;
  participantIds?: string[];
}) {
  const standings = useMemo(() => {
    const baseIds = participantIds ?? Array.from(new Set(games.flatMap((game) => game.scores.map((score) => score.playerId))));
    const map = new Map(baseIds.map((id) => [id, 0]));
    games.forEach((g) => {
      g.scores.forEach((s) => {
        map.set(s.playerId, (map.get(s.playerId) ?? 0) + s.point);
      });
    });
    previewScores?.forEach((score) => map.set(score.playerId, (map.get(score.playerId) ?? 0) + score.point));
    return [...map.entries()].map(([id, profit], order) => ({
      id,
      profit,
      order,
      name: players.find((player) => player.id === id)?.name ?? '不明',
      color: players.find((player) => player.id === id)?.color,
    })).sort((a, b) => b.profit - a.profit || a.order - b.order);
  }, [games, participantIds, players, previewScores]);

  if (standings.length === 0) return null;

  return (
    <section className="live-standings-bar animate-fade-in" aria-label="入力中の暫定順位" aria-live="polite">
      <div className="live-standings-heading">
        <h3><Activity aria-hidden="true" />ライブ暫定順位</h3>
        <span>{previewScores ? '入力中の半荘を反映' : `${games.length}半荘終了時点`}</span>
      </div>
      <div className="live-standings-list">
        {standings.map((row, index) => (
          <div key={row.id} className={index === 0 ? 'is-leading' : ''}>
            <span className="live-standing-rank">{index + 1}</span>
            <i style={{ backgroundColor: row.color }} />
            <strong>{row.name}</strong>
            <em className={row.profit >= 0 ? 'profit-positive' : 'profit-negative'}>{formatSignedYen(row.profit)}</em>
          </div>
        ))}
      </div>
    </section>
  );
}
