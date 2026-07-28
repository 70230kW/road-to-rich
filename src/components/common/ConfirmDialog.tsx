import { AlertTriangle } from 'lucide-react';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '実行する',
  cancelLabel = 'キャンセル',
  danger = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-[#0b1120] border border-rose-500/40 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(244,63,94,0.2)] overflow-hidden">
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-rose-500/10 blur-[60px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-start gap-4">
          <div
            className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center border ${
              danger ? 'bg-rose-950/60 border-rose-500/50 text-rose-400' : 'bg-cyan-950/60 border-cyan-500/50 text-cyan-400'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 id="confirm-dialog-title" className="text-lg font-black text-slate-100 tracking-wide">
              {title}
            </h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="relative z-10 flex gap-3 mt-7">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-5 py-3 rounded-xl font-bold border-2 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:text-white transition-all tracking-wide"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 px-5 py-3 rounded-xl font-black tracking-wide transition-all border ${
              danger
                ? 'bg-rose-600/90 hover:bg-rose-500 border-rose-400/50 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                : 'bg-cyan-600/90 hover:bg-cyan-500 border-cyan-400/50 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
