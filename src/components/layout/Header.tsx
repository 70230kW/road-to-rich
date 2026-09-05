export function Header() {
  return (
    <header className="mb-8 md:mb-10 text-center pt-6 md:pt-8 pb-4 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-24 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none" />
      <h1 className="text-3xl sm:text-4xl md:text-6xl font-black font-display tracking-[0.15em] md:tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-500 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)] mb-3 relative z-10">
        じゃんかね
      </h1>
      <div className="flex items-center justify-center gap-3 relative z-10">
        <span className="w-8 md:w-12 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-cyan-500" />
        <p className="text-cyan-300 text-[9px] sm:text-[10px] md:text-xs tracking-[0.1em] md:tracking-[0.2em] font-mono font-bold drop-shadow-[0_0_5px_rgba(6,182,212,0.8)] uppercase">
          Road to Rich
        </p>
        <span className="w-8 md:w-12 h-[2px] bg-gradient-to-l from-transparent via-cyan-400 to-cyan-500" />
      </div>
      <p className="mt-2 text-slate-600 text-[8px] sm:text-[9px] md:text-[10px] tracking-[0.15em] font-mono uppercase relative z-10">
        Provided by K.Waga
      </p>
    </header>
  );
}
