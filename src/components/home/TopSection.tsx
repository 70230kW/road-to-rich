import { useAppStore } from '../../store/useAppStore';
import { useLayoutEffect } from 'react';
import { MahjongTileMenu } from './tiles/MahjongTileMenu';

/** Independent entry screen. League summaries remain on LeagueHomeSection. */
export function TopSection({ menuIndex, onMenuChange, onOpenMatch, onNavigate }: {
  menuIndex: number;
  onMenuChange?: (index: number) => void;
  onOpenMatch: () => void;
  onNavigate: (id: string) => void;
}) {
  const games = useAppStore(state => state.currentDayGames.length);
  const session = useAppStore(state => state.currentSession);
  const canResume = games > 0 || Boolean(session && new Date(session.startedAt).toDateString() === new Date().toDateString());
  useLayoutEffect(() => {
    const elements = [document.documentElement, document.body];
    const previous = elements.map(element => element.classList.contains('top-scroll-locked'));
    elements.forEach(element => element.classList.add('top-scroll-locked'));
    return () => elements.forEach((element, index) => {
      if (!previous[index]) element.classList.remove('top-scroll-locked');
    });
  }, []);
  return <div className="top-screen" aria-label="TOP画面">
    <MahjongTileMenu resumeLabel={canResume ? `対局入力を続ける（第${games + 1}半荘）` : undefined} initialIndex={menuIndex} onSelectionChange={onMenuChange} onOpen={id => id === 'input' ? onOpenMatch() : onNavigate(id)} />
  </div>;
}
