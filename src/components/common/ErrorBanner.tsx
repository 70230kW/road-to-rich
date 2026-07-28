import { AlertCircle } from 'lucide-react';

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="bg-rose-950/40 border border-rose-500/50 p-4 md:p-5 rounded-2xl flex items-start gap-4 shadow-[0_0_20px_rgba(244,63,94,0.15)] backdrop-blur-md animate-fade-in"
    >
      <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
      <div className="text-rose-200 text-sm font-bold tracking-wide mt-0.5">{message}</div>
    </div>
  );
}
