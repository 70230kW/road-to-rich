import { gapToHigher, rankPositions, rankingComparison } from '../../lib/rankingMovement';
import { useMemo, useState } from 'react';
import { Crown, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import {
  computePlayerRateStats,
  computePlayerYakumanAchievements,
  computeRadarStats,
  computeRankCounts,
  computeRanking,
} from '../../lib/stats';
import { filterHistoryBySeason } from '../../lib/season';
import { computePlayerRankStatuses } from '../../lib/rankLevel';
import { formatSignedYen } from '../../lib/format';
import { SectionHeader } from '../common/SectionHeader';
import { PeriodFilter } from '../common/PeriodFilter';
import { useViewContext } from '../../store/useViewPreferences';
import { EmptyState } from '../common/EmptyState';
import { RankBadge } from '../common/RankBadge';
import { PlayerDetailModal } from './PlayerDetailModal';
import { ScrambleText } from '../common/ScrambleText';

export function RankingSection() {
  const fullHistory = useAppStore((s) => s.history);
  const players = useAppStore((s) => s.players);
  const { season, activeId } = useViewContext();
  const history = useMemo(() => filterHistoryBySeason(fullHistory, season), [fullHistory, season]);

  const rows = useMemo(() => computeRanking(history, players), [history, players]);
  const positions = useMemo(() => rankPositions(rows), [rows]);
  const comparison = useMemo(() => rankingComparison(fullHistory, players, season), [fullHistory, players, season]);
  const activeRow = rows.find(r => r.playerId === activeId);
  const gap = gapToHigher(rows, activeId);
  const radarRows = useMemo(() => computeRadarStats(history, players), [history, players]);
  const rankCounts = useMemo(() => computeRankCounts(history, players), [history, players]);
  const yakumanAchievements = useMemo(() => computePlayerYakumanAchievements(history, players), [history, players]);
  const rateStats = useMemo(() => computePlayerRateStats(history, players), [history, players]);
  // 段位は季節に関係なく、通算の累計ptで判定する（一時的な絞り込みで昇段・降段して見えないように）。
  const rankStatuses = useMemo(() => computePlayerRankStatuses(fullHistory, players), [fullHistory, players]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [density, setDensity] = useState<'simple' | 'detail'>('simple');

  const seasonSelect = <PeriodFilter />;

  if (rows.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader icon={Crown} title="総合ランキング" accent="yellow" trailing={seasonSelect} />
        <EmptyState icon={Crown} message="ランキングデータがありません" hint="精算を保存すると、雀士ごとの累計成績が表示されます。" />
      </div>
    );
  }

  const selectedIdx = rows.findIndex((r) => r.playerId === selectedPlayerId);
  const selectedRow = selectedIdx >= 0 ? rows[selectedIdx] : null;
  const selectedRadarRow = radarRows.find((r) => r.playerId === selectedPlayerId) ?? null;

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeader icon={Crown} title="総合ランキング" accent="yellow" trailing={seasonSelect} />

      {activeRow && <section className="ranking-target"><div><span className="eyebrow">YOUR NEXT TARGET</span><h3>{activeRow.name} · <ScrambleText text={String(positions[activeId])} />位</h3></div><p>{gap === null ? '現在トップの収支です' : <>上位の収支まで <strong><ScrambleText text={`¥${Math.ceil(gap).toLocaleString()}`} /></strong></>}</p></section>}
      <div className="section-kicker"><span className="eyebrow">THE LEADERBOARD</span><span>{rows.length}人の雀士 · 場代抜き収支順（円）</span></div>
      <div className="podium" aria-label="上位3名">
        {rows.slice(0, 3).map((row, idx) => (
          <button type="button" key={row.playerId} className={`podium-player podium-${idx + 1}`}
            onClick={() => setSelectedPlayerId(row.playerId)} aria-label={`${positions[row.playerId]}位 ${row.name}の成績詳細`}>
            <span className="podium-crown">{positions[row.playerId] === 1 ? <Crown size={22} /> : <span>{String(positions[row.playerId]).padStart(2, '0')}</span>}</span>
            <span className="player-avatar">{Array.from(row.name)[0]}</span>
            <strong className="podium-name">{row.name}</strong>
            <span className="podium-tier">{rankStatuses[row.playerId]?.levelName}</span>
            <span className={`podium-profit ${row.totalProfitWithoutFee >= 0 ? 'profit-positive' : 'profit-negative'}`}><ScrambleText text={formatSignedYen(row.totalProfitWithoutFee)} /></span>
            <span className="podium-base"><span>{String(positions[row.playerId]).padStart(2, '0')}</span><small>{row.hanchanCount} 半荘</small></span>
          </button>
        ))}
      </div>
      <div className="section-kicker"><h3>すべての雀士</h3><div className="density-switch" role="group" aria-label="順位表の表示密度"><button type="button" aria-pressed={density === 'simple'} onClick={() => setDensity('simple')}>シンプル</button><button type="button" aria-pressed={density === 'detail'} onClick={() => setDensity('detail')}>詳細</button></div></div>
      <div className={`leaderboard-list is-${density}`}>
        {rows.map((row, idx) => (
          <button type="button" key={row.playerId} className={`leaderboard-row ${row.playerId === activeId ? 'is-selected-player' : ''}`} onClick={() => setSelectedPlayerId(row.playerId)}>
            <span className={`leaderboard-place ${idx < 3 ? 'text-gold' : ''}`}>{String(positions[row.playerId]).padStart(2, '0')}</span>
            <div className="leaderboard-person"><strong>{row.name}</strong>
              {rankStatuses[row.playerId] && <RankBadge status={rankStatuses[row.playerId]!} />}
              <small className="rank-movement">{comparison.positions[row.playerId] == null ? '比較データなし' : (() => { const delta = comparison.positions[row.playerId] - positions[row.playerId]; return delta > 0 ? `↑ ${delta}位上昇` : delta < 0 ? `↓ ${Math.abs(delta)}位下降` : '→ 順位維持'; })()}</small>
              <small className="leaderboard-detail">{row.hanchanCount}半荘 · 平均 {row.avgRank?.toFixed(2) ?? '—'}位</small>
            </div>
            <div className="leaderboard-profit"><strong className={row.totalProfitWithoutFee >= 0 ? 'profit-positive' : 'profit-negative'}><ScrambleText text={formatSignedYen(row.totalProfitWithoutFee)} /></strong>
              <small className="leaderboard-detail">場代込み {formatSignedYen(row.totalProfitWithFee)}</small>
              <small className="leaderboard-detail">平均チップ {row.avgChips?.toFixed(2) ?? '—'}枚 / 日</small>
            </div><ChevronRight size={15} className="text-slate-500 shrink-0" />
          </button>
        ))}
      </div>

      {selectedRow && (
        <PlayerDetailModal
          row={selectedRow}
          radarRow={selectedRadarRow}
          rankCounts={selectedPlayerId ? (rankCounts[selectedPlayerId] ?? []) : []}
          yakumanAchievements={selectedPlayerId ? (yakumanAchievements[selectedPlayerId] ?? []) : []}
          rateStats={
            (selectedPlayerId ? rateStats[selectedPlayerId] : undefined) ?? {
              topRate: null,
              rentaiRate: null,
              lastRate: null,
              tobiRate: null,
            }
          }
          rank={positions[selectedRow.playerId]}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}
    </div>
  );
}
