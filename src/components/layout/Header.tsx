import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { GlitchText } from '../common/GlitchText';

export function Header({ playerSelect, onOpenMenu }: { playerSelect?: ReactNode; onOpenMenu?: () => void }) {
  const [compact, setCompact] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const measure = () => document.documentElement.style.setProperty('--league-header-height', `${header.getBoundingClientRect().height}px`);
    measure();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    observer?.observe(header);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); document.documentElement.style.removeProperty('--league-header-height'); };
  }, []);
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 72);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header ref={headerRef} className={`app-header ${compact ? 'is-compact' : ''}`}>
      <div className="brand-lockup">
        <h1 className="font-brand text-lg tracking-wider text-white">
          <GlitchText text="じゃんかね" />
        </h1>
        <p className="eyebrow mt-1">
          <GlitchText text="ROAD TO RICH" />
        </p>
      </div>
      <div className="header-actions">
        {playerSelect ?? <span className="league-label"><span /> MAHJONG LEAGUE</span>}
        {onOpenMenu && (
          <button
            type="button"
            className="header-menu-button"
            onClick={onOpenMenu}
            aria-label="メニューを開く"
            aria-haspopup="dialog"
          >
            <Menu aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  );
}
