import type { ReactNode } from 'react';

/** Branded animated loader: pulsing glow + counter-spinning rings around the app mark. */
export function LoadingScreen({ label = 'LOADING' }: { label?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 animate-fade-in">
      <div className="relative w-24 h-24 md:w-28 md:h-28 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-2xl animate-pulse" />
        <div
          className="absolute inset-0 rounded-full border-2 border-cyan-900/50 border-t-cyan-400 animate-spin"
          style={{ animationDuration: '1.4s' }}
        />
        <div
          className="absolute inset-2 rounded-full border-2 border-fuchsia-900/40 border-b-fuchsia-400 animate-spin"
          style={{ animationDuration: '2s', animationDirection: 'reverse' }}
        />
        <img
          src="/android-chrome-192x192.png"
          alt=""
          className="w-14 h-14 md:w-16 md:h-16 rounded-full animate-logo-pulse relative z-10"
        />
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="font-mono text-xs md:text-sm tracking-[0.3em] text-cyan-300 font-black uppercase flex items-baseline">
          <span>{label}</span>
          <span className="inline-flex ml-0.5">
            <span className="animate-dot-fade" style={{ animationDelay: '0s' }}>
              .
            </span>
            <span className="animate-dot-fade" style={{ animationDelay: '0.2s' }}>
              .
            </span>
            <span className="animate-dot-fade" style={{ animationDelay: '0.4s' }}>
              .
            </span>
          </span>
        </p>
        <div className="w-40 md:w-48 h-[3px] bg-slate-800 rounded-full overflow-hidden relative">
          <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan-bar" />
        </div>
      </div>
    </div>
  );
}
