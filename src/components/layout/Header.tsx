import { GlitchText } from '../common/GlitchText';

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
