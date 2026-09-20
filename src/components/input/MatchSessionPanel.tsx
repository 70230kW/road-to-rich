import { useMemo, useState } from 'react';
import { CalendarDays, Check, Flag, Play, RotateCcw, Users } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatSignedYen } from '../../lib/format';
import { haptic } from '../../lib/haptics';
import { NeonButton } from '../common/NeonButton';
import { ConfirmDialog } from '../common/ConfirmDialog';

function defaultTitle() {
  return `${new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })} 対局会`;
}

export function MatchSessionPanel({ onSettle }: { onSettle: () => void }) {
  const players = useAppStore((s) => s.players);
  const settings = useAppStore((s) => s.settings);
  const games = useAppStore((s) => s.currentDayGames);
  const session = useAppStore((s) => s.currentSession);
  const startSession = useAppStore((s) => s.startSession);
  const clearSession = useAppStore((s) => s.clearSession);
  const [title, setTitle] = useState(defaultTitle);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => players.map((player) => player.id));
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [saving, setSaving] = useState(false);

  const standings = useMemo(() => {
    const totals = new Map<string, number>();
    games.forEach((game) => game.scores.forEach((score) => totals.set(score.playerId, (totals.get(score.playerId) ?? 0) + score.point)));
    return (session?.participantIds ?? []).map((id) => ({
      id,
      name: players.find((player) => player.id === id)?.name ?? '不明',
      point: totals.get(id) ?? 0,
    })).sort((a, b) => b.point - a.point);
  }, [games, players, session?.participantIds]);

  const togglePlayer = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };

  if (!session) {
    const canStart = title.trim().length > 0 && selectedIds.length >= settings.playerCount;
    return (
      <section className="match-session-setup">
        <div className="content-section-header">
          <div><span className="eyebrow">MATCH NIGHT</span><h3><CalendarDays size={18} /> 対局会を開始</h3></div>
          <small>参加メンバーと会の名前を先に設定します</small>
        </div>
        <label className="session-title-field"><span>対局会名</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <div className="session-player-grid" role="group" aria-label="対局会の参加雀士">
          {players.map((player) => {
            const selected = selectedIds.includes(player.id);
            return <button key={player.id} type="button" aria-pressed={selected} onClick={() => togglePlayer(player.id)}><span style={{ backgroundColor: player.color }} />{player.name}{selected && <Check size={14} />}</button>;
          })}
        </div>
        <div className="session-setup-footer"><small>{settings.playerCount}人以上を選択してください</small><NeonButton variant="primary" disabled={!canStart || saving} onClick={async () => {
          setSaving(true);
          await startSession(title, selectedIds);
          haptic('success');
          setSaving(false);
        }}><Play size={17} className="mr-2" />{saving ? '開始中…' : '対局会を開始'}</NeonButton></div>
      </section>
    );
  }

  return (
    <section className="match-session-live">
      <div className="session-live-heading"><div><span className="session-live-dot" /><div><span className="eyebrow">LIVE SESSION</span><h3>{session.title}</h3></div></div><strong>{games.length}<small>半荘</small></strong></div>
      <div className="session-live-meta"><span><Users size={13} />{session.participantIds.length}人参加</span><span><Flag size={13} />{new Date(session.startedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}開始</span></div>
      {standings.length > 0 && <div className="session-standings">{standings.map((row, index) => <div key={row.id}><span>{index + 1}</span><strong>{row.name}</strong><em className={row.point >= 0 ? 'profit-positive' : 'profit-negative'}>{formatSignedYen(row.point)}</em></div>)}</div>}
      <div className="session-live-actions"><button type="button" onClick={() => setConfirmingClear(true)}><RotateCcw size={15} />設定を解除</button>{games.length > 0 && <NeonButton variant="success" onClick={() => { haptic('light'); onSettle(); }}>対局会を精算する</NeonButton>}</div>
      <ConfirmDialog open={confirmingClear} title="対局会設定を解除" message="対局会名と参加メンバーの設定を解除します。記録済みの半荘データは削除されません。" confirmLabel="設定を解除" onCancel={() => setConfirmingClear(false)} onConfirm={() => { clearSession(); setConfirmingClear(false); }} />
    </section>
  );
}
