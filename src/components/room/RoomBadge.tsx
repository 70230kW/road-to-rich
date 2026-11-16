import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ConfirmDialog } from '../common/ConfirmDialog';

export function RoomBadge() {
  const roomCode = useAppStore((s) => s.roomCode);
  const status = useAppStore((s) => s.connectionStatus);
  const leaveRoom = useAppStore((s) => s.leaveRoom);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!roomCode) return null;

  const dotColor =
    status === 'synced' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]' : 'bg-cyan-400 shadow-[0_0_8px_rgb(var(--accent-rgb-400)/0.9)]';

  return (
    <div className="room-badge">
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          aria-label="ルームを離れる"
          title={`ルーム：${roomCode}（${status === 'synced' ? '同期済み' : '接続中'}）`}
          className="room-badge-button"
        >
          <span aria-hidden="true" className={`room-status-dot ${dotColor}`} />
          <span className="room-code">{roomCode}</span>
          <LogOut className="w-3.5 h-3.5" />
        </button>

      <ConfirmDialog
        open={confirmOpen}
        title="ルームを離れる"
        message="このルームから離れます。データは失われませんが、再度入るにはルームコードの入力が必要です。よろしいですか？"
        confirmLabel="離れる"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          leaveRoom();
          setConfirmOpen(false);
        }}
      />
    </div>
  );
}
