import { ArrowUpRight } from 'lucide-react';
import { MahjongTileMenu } from './tiles/MahjongTileMenu';

/** Independent entry screen. League summaries remain on LeagueHomeSection. */
export function TopSection({ menuIndex, onMenuChange, onOpenMatch, onNavigate }: {
  menuIndex: number;
  onMenuChange?: (index: number) => void;
  onOpenMatch: () => void;
  onNavigate: (id: string) => void;
}) {
  return <div aria-label="TOP画面">
    <MahjongTileMenu initialIndex={menuIndex} onSelectionChange={onMenuChange} onOpen={id => id === 'input' ? onOpenMatch() : onNavigate(id)} />
    <button type="button" className="top-overview-link" onClick={() => onNavigate('home')}>リーグホームを見る<ArrowUpRight size={16} aria-hidden="true" /></button>
  </div>;
}
