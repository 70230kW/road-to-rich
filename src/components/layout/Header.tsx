import { useEffect, useState, type ReactNode } from 'react';
import { GlitchText } from '../common/GlitchText';

export function Header({ playerSelect }: { playerSelect?: ReactNode }) {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 72);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header className={`app-header ${compact ? 'is-compact' : ''}`}>
      <div className="brand-lockup">
        <h1 className="font-brand text-lg tracking-wider text-white">
          <GlitchText text="じゃんかね" />
        </h1>
        <p className="eyebrow mt-1">
          <GlitchText text="ROAD TO RICH" />
        </p>
      </div>
      {playerSelect ?? <span className="league-label"><span /> MAHJONG LEAGUE</span>}
    </header>
  );
}
