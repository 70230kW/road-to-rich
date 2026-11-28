import { AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useId, useRef } from 'react';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '実行する',
  cancelLabel = 'キャンセル',
  danger = true,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const current = useRef({ onCancel, busy });
  useEffect(() => { current.current = { onCancel, busy }; }, [onCancel, busy]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLButtonElement>('button')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !current.current.busy) { event.preventDefault(); current.current.onCancel(); }
      if (event.key !== 'Tab' || !panel) return;
      const buttons = [...panel.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
      if (!buttons.length) { event.preventDefault(); panel.focus(); return; }
      const target = event.shiftKey ? buttons.at(-1)! : buttons[0];
      if (!panel.contains(document.activeElement) || (event.shiftKey ? document.activeElement === buttons[0] : document.activeElement === buttons.at(-1))) { event.preventDefault(); target.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); if (previous?.isConnected) previous.focus(); };
  }, [open]);
  if (!open) return null;

  return createPortal(
    <div
      className="confirm-dialog fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-busy={busy}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { if (!busy) onCancel(); }} />
      <div ref={panelRef} tabIndex={-1} className="confirm-dialog-panel relative w-full max-w-md bg-panel border border-rose-500/40 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(244,63,94,0.2)] overflow-hidden">
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
            <h3 id={titleId} className="text-lg font-black text-slate-100 tracking-wide">
              {title}
            </h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="relative z-10 flex gap-3 mt-7">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="glass-button flex-1 px-5 py-3 rounded-xl font-bold border-2 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:text-white transition-all tracking-wide"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`glass-button ${danger ? 'glass-danger' : 'glass-primary'} flex-1 px-5 py-3 rounded-xl font-black tracking-wide transition-all border ${
              danger
                ? 'bg-rose-600/90 hover:bg-rose-500 border-rose-400/50 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                : 'bg-cyan-600/90 hover:bg-cyan-500 border-cyan-400/50 text-white shadow-[0_0_20px_rgb(var(--accent-rgb-500)/0.3)]'
            }`}
          >
            {busy ? '保存中…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
