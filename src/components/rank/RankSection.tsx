import { RankEmblem } from '../common/RankEmblem';
import { useViewContext } from '../../store/useViewPreferences';
import { useMemo, useState } from 'react';
import { ChevronDown, Gauge, Sparkles, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { computePlayerRankStatuses, groupRankTiers, type RankGroup } from '../../lib/rankLevel';
import { RANK_GROUP_THEME } from '../common/RankBadge';
import { formatSignedYen } from '../../lib/format';
import { SectionHeader } from '../common/SectionHeader';
import { EmptyState } from '../common/EmptyState';
import { ScrambleText } from '../common/ScrambleText';

export function RankSection() {
  const players = useAppStore((s) => s.players);
  const history = useAppStore((s) => s.history);
  const { activeId } = useViewContext();
  const statuses = useMemo(() => computePlayerRankStatuses(history, players), [history, players]);
  const groups = useMemo(() => groupRankTiers().reverse().map((group) => ({ ...group, levels: [...group.levels].reverse() })), []);
  const [expandedGroups, setExpandedGroups] = useState<Set<RankGroup>>(() => new Set(['魂天']));

  const toggleGroup = (group: RankGroup) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const rankedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const sa = statuses[a.id];
      const sb = statuses[b.id];
      if (!sa || !sb) return 0;
      if (sb.levelIndex !== sa.levelIndex) return sb.levelIndex - sa.levelIndex;
      return sb.cumulativeProfit - sa.cumulativeProfit;
    });
  }, [players, statuses]);

  const scrollToTierList = () => {
    document.getElementById('rank-tier-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (players.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader icon={Gauge} title="段位" accent="cyan" />
        <EmptyState icon={Users} message="雀士が登録されていません" hint="「雀士登録」タブで雀士を登録すると、段位が表示されます。" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeader icon={Gauge} title="段位" accent="cyan" />
      {statuses[activeId] && (() => {
        const status = statuses[activeId];
        const recentDays = [...history].filter(d => d.settlement[activeId]).sort((a,b) => Date.parse(b.date)-Date.parse(a.date)).slice(0,4);
        return <>
          <section className="rank-hero">
            <p className="eyebrow">YOUR MAHJONG CAREER</p>
            <RankEmblem status={status} />
            <p className="rank-title">{status.levelName}</p>
            <p className="muted text-xs mb-5">通算の累計収支で決まる、あなたの段位</p>
            <strong className="rank-total"><ScrambleText text={formatSignedYen(status.cumulativeProfit)} /></strong>
            <p className="eyebrow mt-2 mb-7">LIFETIME PROFIT · 場代抜き（円）</p>
            <div className="rank-next"><span>{status.levelName}</span><span>{status.nextLevelName ?? '最高段位'}</span></div>
            <progress className="rank-progress" value={status.progressRatio} max={1} aria-label="次の段位への進捗" />
            <p className="rank-remaining">{status.nextLevelName ? <>昇段まであと <strong><ScrambleText text={`¥${status.profitToNextLevel!.toLocaleString()}`} /></strong></> : '最高段位に到達しました！'}</p>
          </section>
          <section className="premium-panel"><div className="section-kicker"><h3>直近の段位対象収支</h3><span>場代抜き（円）</span></div>
            {recentDays.map(day => <div key={day.id} className="rank-day"><span>{new Date(day.date).toLocaleDateString('ja-JP')}</span><strong className={day.settlement[activeId].totalWithoutFee >= 0 ? 'profit-positive' : 'profit-negative'}><ScrambleText text={formatSignedYen(day.settlement[activeId].totalWithoutFee)} /></strong></div>)}
            {recentDays.length === 0 && <p className="muted py-4 text-sm">最初の精算を保存すると表示されます。</p>}
          </section>
        </>;
      })()}
      <p className="muted text-xs leading-6">段位はシーズンに関係なく場代抜きの累計収支で判定し、収支に応じて昇段・降段します。
        <button type="button" onClick={scrollToTierList} className="text-gold underline underline-offset-4 ml-2">達成条件を見る</button>
      </p>
      <details className="rank-members"><summary>仲間の段位を見る</summary>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rankedPlayers.map((p) => {
          const status = statuses[p.id];
          if (!status) return null;
          const theme = RANK_GROUP_THEME[status.group];
          return (
            <div key={p.id} className="bg-panel-2/70 p-5 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-black text-slate-100 text-lg truncate">{p.name}</span>
                <span className={`font-mono text-lg font-black shrink-0 ${theme.text}`}>{status.levelName}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${theme.bar} transition-all`}
                  style={{ width: `${status.progressRatio * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-2">
                <span>累計収支 {formatSignedYen(status.cumulativeProfit)}</span>
                <span>
                  {status.nextLevelName
                    ? `次の${status.nextLevelName}まであと ${formatSignedYen(status.profitToNextLevel!)}`
                    : '最高段位に到達！'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      </details>

      <div
        id="rank-tier-list"
        className="bg-panel-2/80 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden backdrop-blur-md scroll-mt-4"
      >
        <div className="rank-ladder-heading"><div><span className="eyebrow">RANK LADDER</span><h3>段位一覧</h3></div><div className="rank-ladder-direction"><TrendingUp size={15} /><span>上ほど高段位</span></div></div>
        <p className="text-[11px] text-slate-500 mb-6">魂天を頂点に、現在の累計収支から段位を判定します。タップすると各段位の条件を確認できます。</p>
        <div className="rank-ladder">
          {groups.map((g, idx) => {
            const theme = RANK_GROUP_THEME[g.group];
            const isTop = g.maxProfitExclusive === null;
            const isBottom = g.group === '地底人';
            const rangeText = isTop
              ? `${formatSignedYen(g.minProfit)} 以上`
              : isBottom
                ? `${formatSignedYen(g.maxProfitExclusive!)} 未満`
                : `${formatSignedYen(g.minProfit)} 以上 〜 ${formatSignedYen(g.maxProfitExclusive!)} 未満`;
            const isExpanded = expandedGroups.has(g.group);

            return (
              <div key={g.group} className={`rank-ladder-card ${isTop ? 'is-top' : ''} ${isBottom ? 'is-bottom' : ''} ${theme.border} ${theme.bg}`}>
                <span className="rank-ladder-index">{String(idx + 1).padStart(2, '0')}</span>
                <button
                  type="button"
                  onClick={() => toggleGroup(g.group)}
                  aria-expanded={isExpanded}
                  aria-label={`${g.group}の内訳を${isExpanded ? '閉じる' : '開く'}`}
                  className="rank-ladder-toggle"
                >
                  <span className={`rank-ladder-name ${theme.text}`}>{isTop && <Sparkles size={16} />}{isBottom && <TrendingDown size={16} />}{g.group}</span>
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="font-mono text-xs sm:text-sm text-slate-300">収支 {rangeText}</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 ${theme.text} transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 space-y-1.5">
                    {g.levels.map((tier) => (
                      <div key={tier.name} className="flex items-center justify-between gap-2 bg-abyss/50 rounded-lg px-4 py-2">
                        <span className={`font-bold text-xs shrink-0 ${theme.text}`}>{tier.name}</span>
                        <span className="font-mono text-[11px] text-slate-400 text-right whitespace-nowrap">
                          収支 {formatSignedYen(tier.minProfit)} 以上
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
