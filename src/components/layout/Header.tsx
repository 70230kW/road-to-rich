function GlitchText({ text }: { text: string }) {
  return (
    <span className="brand-glitch">
      {text}
      <span className="brand-glitch-layer brand-glitch-layer-a" aria-hidden="true">{text}</span>
      <span className="brand-glitch-layer brand-glitch-layer-b" aria-hidden="true">{text}</span>
    </span>
  );
}

export function Header() {
  return (
    <header className="app-header">
      <div className="brand-lockup">
        <h1 className="font-brand text-lg tracking-wider text-white">
          <GlitchText text="じゃんかね" />
        </h1>
        <p className="eyebrow mt-1">
          <GlitchText text="ROAD TO RICH" />
        </p>
      </div>
      <span className="league-label"><span /> MAHJONG LEAGUE</span>
    </header>
  );
}
