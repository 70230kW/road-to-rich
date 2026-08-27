import { useMemo, useState } from 'react';
import { ChevronDown, Lock, Trophy, Users } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { computePlayerTrophies, TROPHY_LIST, TROPHY_TIER_LABELS, TROPHY_TIERS, type TrophyTier } from '../../lib/trophies';
import { filterHistoryBySeason, getAvailableSeasons, type SeasonFilter } from '../../lib/season';
import { SectionHeader } from '../common/SectionHeader';
import { SeasonSelect } from '../common/SeasonSelect';
import { EmptyState } from '../common/EmptyState';

const TIER_THEME: Record<
  TrophyTier,
  { chipText: string; chipBorder: string; chipBg: string; earnedText: string; earnedBorder: string; earnedBg: string; earnedGlow: string }
> = {
  bronze: {
    chipText: 'text-amber-500',
    chipBorder: 'border-amber-700/50',
    chipBg: 'bg-amber-950/20',
    earnedText: 'text-amber-300',
    earnedBorder: 'border-amber-600/60',
    earnedBg: 'bg-amber-950/30',
    earnedGlow: 'shadow-[0_0_15px_rgba(217,119,6,0.15)]',
  },
  silver: {
    chipText: 'text-slate-300',
    chipBorder: 'border-slate-400/40',
    chipBg: 'bg-slate-800/30',
    earnedText: 'text-slate-100',
    earnedBorder: 'border-slate-300/60',
    earnedBg: 'bg-slate-700/30',
    earnedGlow: 'shadow-[0_0_15px_rgba(203,213,225,0.15)]',
  },
  gold: {
    chipText: 'text-yellow-400',
    chipBorder: 'border-yellow-500/50',
    chipBg: 'bg-yellow-950/20',
    earnedText: 'text-yellow-200',
    earnedBorder: 'border-yellow-400/70',
    earnedBg: 'bg-yellow-950/30',
    earnedGlow: 'shadow-[0_0_18px_rgba(250,204,21,0.25)]',
  },
  platinum: {
    chipText: 'text-cyan-300',
    chipBorder: 'border-cyan-400/40',
    chipBg: 'bg-cyan-950/20',
    earnedText: 'text-cyan-100',
    earnedBorder: 'border-cyan-300/70',
    earnedBg: 'bg-cyan-950/30',
    earnedGlow: 'shadow-[0_0_18px_rgba(103,232,249,0.25)]',
  },
  special: {
    chipText: 'text-fuchsia-400',
    chipBorder: 'border-fuchsia-500/40',
    chipBg: 'bg-fuchsia-950/20',
    earnedText: 'text-fuchsia-200',
    earnedBorder: 'border-fuchsia-400/70',
    earnedBg: 'bg-fuchsia-950/30',
    earnedGlow: 'shadow-[0_0_18px_rgba(232,121,249,0.3)]',
  },
  underground: {
    chipText: 'text-rose-500',
    chipBorder: 'border-rose-800/50',
    chipBg: 'bg-rose-950/20',
    earnedText: 'text-rose-300',
    earnedBorder: 'border-rose-700/70',
    earnedBg: 'bg-rose-950/40',
    earnedGlow: 'shadow-[0_0_15px_rgba(190,18,60,0.3)]',
  },
  impossible: {
    chipText: 'text-violet-300',
    chipBorder: 'border-violet-500/50',
    chipBg: 'bg-violet-950/20',
    earnedText: 'text-violet-100',
    earnedBorder: 'border-violet-400/80',
    earnedBg: 'bg-violet-950/40',
    earnedGlow: 'shadow-[0_0_25px_rgba(167,139,250,0.4)]',
  },
};

export function TrophySection() {
  const players = useAppStore((s) => s.players);
  const fullHistory = useAppStore((s) => s.history);
  const settings = useAppStore((s) => s.settings);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [collapsedTiers, setCollapsedTiers] = useState<Set<TrophyTier>>(new Set());
  const [season, setSeason] = useState<SeasonFilter>('all');
  const seasons = useMemo(() => getAvailableSeasons(fullHistory), [fullHistory]);
  const history = useMemo(() => filterHistoryBySeason(fullHistory, season), [fullHistory, season]);

  const trophiesByPlayer = useMemo(() => computePlayerTrophies(history, players, settings), [history, players, settings]);
  const earned = selectedPlayerId ? (trophiesByPlayer[selectedPlayerId] ?? new Set<string>()) : new Set<string>();

  const seasonSelect = <SeasonSelect season={season} onChange={setSeason} seasons={seasons} accent="yellow" />;

  const toggleTier = (tier: TrophyTier) => {
    setCollapsedTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  };

  if (players.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader icon={Trophy} title="トロフィー" accent="yellow" />
        <EmptyState icon={Users} message="No Players" hint="「雀士登録」タブで雀士を登録すると、トロフィーの獲得状況を確認できます。" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeader icon={Trophy} title="トロフィー" accent="yellow" trailing={seasonSelect} />

      <div className="relative">
        <select
          value={selectedPlayerId}
          onChange={(e) => setSelectedPlayerId(e.target.value)}
          className="w-full bg-abyss border border-slate-700/80 rounded-xl pl-4 pr-10 py-3.5 text-slate-100 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50 font-bold appearance-none transition-all cursor-pointer tracking-wide shadow-inner"
        >
          <option value="">雀士を選択してください</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500/70 pointer-events-none" />
      </div>

      {!selectedPlayerId ? (
        <EmptyState icon={Trophy} message="Select a Player" hint="プルダウンから雀士を選ぶと、獲得済み・未獲得のトロフィーが表示されます。" />
      ) : (
        <>
          <div className="flex items-center justify-between bg-panel-2/70 border border-yellow-700/40 rounded-2xl px-5 py-4">
            <span className="font-black text-slate-100 tracking-wide">
              {players.find((p) => p.id === selectedPlayerId)?.name}
            </span>
            <span className="font-mono font-black text-yellow-300">
              {earned.size} <span className="text-slate-500 text-sm">/ {TROPHY_LIST.length}</span>
            </span>
          </div>

          <div className="space-y-6">
            {TROPHY_TIERS.map((tier) => {
              const theme = TIER_THEME[tier];
              const trophies = TROPHY_LIST.filter((t) => t.tier === tier);
              const earnedCount = trophies.filter((t) => earned.has(t.id)).length;
              const isCollapsed = collapsedTiers.has(tier);

              return (
                <div key={tier} className={`rounded-2xl border ${theme.chipBorder} ${theme.chipBg} overflow-hidden`}>
                  <button
                    type="button"
                    onClick={() => toggleTier(tier)}
                    className="w-full flex items-center justify-between px-5 py-4"
                  >
                    <span className={`font-black tracking-[0.2em] uppercase text-sm ${theme.chipText}`}>
                      {TROPHY_TIER_LABELS[tier]}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-xs font-bold ${theme.chipText}`}>
                        {earnedCount} / {trophies.length}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 ${theme.chipText} transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                      />
                    </div>
                  </button>

                  {!isCollapsed && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 px-4 pb-4">
                      {trophies.map((trophy) => {
                        const isEarned = earned.has(trophy.id);
                        return (
                          <div
                            key={trophy.id}
                            className={`relative p-3.5 rounded-xl border transition-all ${
                              isEarned
                                ? `${theme.earnedBg} ${theme.earnedBorder} ${theme.earnedGlow}`
                                : 'bg-abyss/40 border-slate-800/60 opacity-40 grayscale hover:opacity-60'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div
                                className={`font-black text-sm tracking-wide ${isEarned ? theme.earnedText : 'text-slate-500'}`}
                              >
                                {isEarned ? trophy.name : '？？？'}
                              </div>
                              {!isEarned && <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />}
                              {isEarned && <Trophy className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${theme.earnedText}`} />}
                            </div>
                            <div className={`text-[11px] leading-relaxed mt-1 ${isEarned ? 'text-slate-300' : 'text-slate-600'}`}>
                              {isEarned ? trophy.description : '？？？？？？？？？？？？？？？？？？？？'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
