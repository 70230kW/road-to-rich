import { useState } from 'react';
import { CalendarDays, Flag, Play, RotateCcw, Users } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { haptic } from '../../lib/haptics';
import { NeonButton } from '../common/NeonButton';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { SessionPlayerPicker } from './SessionPlayerPicker';

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
  const [selection, setSelection] = useState<string[]>([]);
  const selectedIds = players.filter(player => selection.includes(player.id)).map(player => player.id);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startError, setStartError] = useState(false);

  if (!session) {
    const canStart = title.trim().length > 0 && selectedIds.length >= settings.playerCount;
    const startHint = !title.trim() ? '対局会名を入力してください。' : selectedIds.length < settings.playerCount
      ? `あと${settings.playerCount - selectedIds.length}人選択してください（${settings.playerCount}人麻雀）。`
      : `${selectedIds.length}人で開始できます（${settings.playerCount}人麻雀）。`;
    return (
      <section className="match-session-setup">
        <div className="content-section-header">
          <div><span className="eyebrow">MATCH NIGHT</span><h3><CalendarDays size={18} /> 対局会を開始</h3></div>
          <small>参加メンバーと会の名前を先に設定します</small>
        </div>
        <label className="session-title-field"><span>対局会名</span><input value={title} disabled={saving} onChange={(event) => setTitle(event.target.value)} /></label>
        <SessionPlayerPicker players={players} selectedIds={selectedIds} onChange={setSelection} disabled={saving} />
        <div className="session-setup-footer"><small data-ready={canStart}>{startHint}</small><button type="button" className="session-start-button" disabled={!canStart || saving} onClick={async () => {
          if (!canStart || saving) return;
          setSaving(true); setStartError(false);
          try { await startSession(title, selectedIds); haptic('success'); }
          catch { setStartError(true); }
          finally { setSaving(false); }
        }}><Play size={17} aria-hidden="true" />{saving ? '開始中…' : `${selectedIds.length}人で対局会を開始`}</button></div>
        {startError && <p className="session-start-error" role="alert">対局会を開始できませんでした。通信状態を確認して、もう一度お試しください。</p>}
      </section>
    );
  }

  return (
    <section className="match-session-live">
      <div className="session-live-heading"><div><span className="session-live-dot" /><div><span className="eyebrow">LIVE SESSION</span><h3>{session.title}</h3></div></div><strong>{games.length}<small>半荘</small></strong></div>
      <div className="session-live-meta"><span><Users size={13} />{session.participantIds.length}人参加</span><span><Flag size={13} />{new Date(session.startedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}開始</span></div>
      <div className="session-live-actions"><button type="button" onClick={() => setConfirmingClear(true)}><RotateCcw size={15} />設定を解除</button>{games.length > 0 && <NeonButton variant="success" onClick={() => { haptic('light'); onSettle(); }}>対局会を精算する</NeonButton>}</div>
      <ConfirmDialog open={confirmingClear} title="対局会設定を解除" message="対局会名と参加メンバーの設定を解除します。記録済みの半荘データは削除されません。" confirmLabel="設定を解除" onCancel={() => setConfirmingClear(false)} onConfirm={() => { clearSession(); setConfirmingClear(false); }} />
    </section>
  );
}
