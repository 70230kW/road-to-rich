import { useState } from 'react';
import { LogOut, Radio } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ConfirmDialog } from '../common/ConfirmDialog';

export function RoomBadge() {
  const roomCode = useAppStore((s) => s.roomCode);
  const status = useAppStore((s) => s.connectionStatus);
  const leaveRoom = useAppStore((s) => s.leaveRoom);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!roomCode) return null;

  const dotColor = status === 'synced' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]';

  return (
    <div className="flex items-center justify-center gap-2 mb-4 relative z-10">
      <div className="flex items-center gap-2 bg-panel-2/70 border border-slate-700/60 rounded-full px-4 py-1.5 backdrop-blur-sm">
        <Radio className="w-3.5 h-3.5 text-cyan-400" />
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span className="text-xs font-mono font-bold text-slate-300 tracking-wide">{roomCode}</span>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          aria-label="ルームを離れる"
          className="ml-1 p-1 rounded-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>

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
