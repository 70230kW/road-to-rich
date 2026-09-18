import { ChevronDown, Crown, Flame, Gem, Shield, Sparkles } from 'lucide-react';
import type { PlayerRankStatus, RankGroup } from '../../lib/rankLevel';
const icons = { '地底人': ChevronDown, '雀士': Shield, '雀傑': Gem, '雀豪': Flame, '雀聖': Crown, '魂天': Sparkles };
const classes: Record<RankGroup,string> = { '地底人':'underground', '雀士':'beginner', '雀傑':'expert', '雀豪':'master', '雀聖':'saint', '魂天':'celestial' };
export function RankEmblem({ status, compact = false }: { status: PlayerRankStatus; compact?: boolean }) {
  const Icon = icons[status.group];
  const level = Number(status.levelName.slice(-1));
  return <div className={`career-emblem emblem-${classes[status.group]} ${compact ? 'emblem-compact' : ''}`} aria-hidden="true">
    <span className="emblem-outline" /><span className="emblem-aura" /><Icon size={compact ? 25 : 56} strokeWidth={1.2} />
    {!compact && Number.isFinite(level) && <span className="emblem-stars">{'◆'.repeat(level)}</span>}
  </div>;
}
