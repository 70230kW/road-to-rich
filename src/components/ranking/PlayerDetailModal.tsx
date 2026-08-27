import { createPortal } from 'react-dom';
import { Award, BarChart3, Coins, Crown, Gamepad2, Skull, Sparkles, TrendingDown, TrendingUp, X, Zap } from 'lucide-react';
import type { PlayerYakumanAchievement, RadarRow, RankingRow, RateStats } from '../../lib/stats';
import { formatDate, formatSignedYen } from '../../lib/format';
import { findYakuman } from '../../lib/yakuman';
import { RankCountBars } from './RankCountBars';

function formatRate(value: number | null): string {
  return value !== null ? `${(value * 100).toFixed(1)}%` : '-';
}

export function PlayerDetailModal({
  row,
  radarRow,
  rankCounts,
  yakumanAchievements,
  rateStats,
  rank,
  onClose,
}: {
  row: RankingRow;
  radarRow: RadarRow | null;
  rankCounts: number[];
  yakumanAchievements: PlayerYakumanAchievement[];
  rateStats: RateStats;
  rank: number;
  onClose: () => void;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-detail-title"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#0b1120] border border-cyan-500/40 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden max-h-[85vh] overflow-y-auto">
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-black text-cyan-500 tracking-[0.2em] uppercase mb-1">#{rank}</div>
            <h3 id="player-detail-title" className="text-2xl font-black text-slate-100 tracking-wide">
              {row.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative z-10 bg-abyss/90 p-5 rounded-2xl border border-slate-800/80 mb-6">
          <div className="text-[10px] font-black text-slate-500 mb-1 tracking-[0.2em] uppercase">Total Profit</div>
          <div
            className={`font-mono text-3xl font-black ${
              row.totalProfitWithoutFee >= 0
                ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]'
                : 'text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]'
            }`}
          >
            {formatSignedYen(row.totalProfitWithoutFee)}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-1">場代込み {formatSignedYen(row.totalProfitWithFee)}</div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-3">
          <div className="bg-abyss/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center text-[10px] font-black text-slate-500 tracking-widest uppercase mb-1.5">
              <Gamepad2 className="w-3.5 h-3.5 mr-1.5 text-cyan-500" /> 半荘数
            </div>
            <div className="font-mono text-xl font-black text-slate-100">{row.hanchanCount}</div>
          </div>
          <div className="bg-abyss/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center text-[10px] font-black text-slate-500 tracking-widest uppercase mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-fuchsia-500" /> 平均着順
            </div>
            <div className="font-mono text-xl font-black text-slate-100">
              {row.avgRank !== null ? row.avgRank.toFixed(2) : '-'}
            </div>
          </div>
          <div className="bg-abyss/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center text-[10px] font-black text-slate-500 tracking-widest uppercase mb-1.5">
              <Zap className="w-3.5 h-3.5 mr-1.5 text-yellow-500" /> 平均チップ（1日）
            </div>
            <div className={`font-mono text-xl font-black ${(row.avgChips ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {row.avgChips !== null ? `${row.avgChips > 0 ? '+' : ''}${row.avgChips.toFixed(2)}` : '-'}
            </div>
          </div>
          <div className="bg-abyss/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center text-[10px] font-black text-slate-500 tracking-widest uppercase mb-1.5">
              <Coins className="w-3.5 h-3.5 mr-1.5 text-rose-400" /> チップ累計
            </div>
            <div className={`font-mono text-xl font-black ${(radarRow?.chipTotal ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {radarRow ? `${radarRow.chipTotal > 0 ? '+' : ''}${radarRow.chipTotal}枚` : '-'}
            </div>
          </div>
          <div className="bg-abyss/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center text-[10px] font-black text-slate-500 tracking-widest uppercase mb-1.5">
              <Award className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> 最高素点
            </div>
            <div className="font-mono text-xl font-black text-slate-100">
              {radarRow ? radarRow.highestScore.toLocaleString() : '-'}
            </div>
          </div>
          <div className="bg-abyss/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center text-[10px] font-black text-slate-500 tracking-widest uppercase mb-1.5">
              <Crown className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> 1日最高勝ち額
            </div>
            <div className="font-mono text-xl font-black text-slate-100">
              {radarRow ? formatSignedYen(radarRow.bestDailyWin) : '-'}
            </div>
          </div>
        </div>

        <div className="relative z-10 bg-abyss/60 p-5 rounded-2xl border border-slate-800/80 mt-3">
          <div className="flex items-center text-[10px] font-black text-slate-500 tracking-widest uppercase mb-3">
            <Crown className="w-3.5 h-3.5 mr-1.5 text-yellow-500" /> 着順の勝率
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center text-[10px] font-black text-slate-500 tracking-widest uppercase mb-1">
                <Crown className="w-3 h-3 mr-1 text-yellow-500" /> トップ率
              </div>
              <div className="font-mono text-lg font-black text-yellow-300">{formatRate(rateStats.topRate)}</div>
            </div>
            <div>
              <div className="flex items-center text-[10px] font-black text-slate-500 tracking-widest uppercase mb-1">
                <TrendingUp className="w-3 h-3 mr-1 text-emerald-500" /> 連対率
              </div>
              <div className="font-mono text-lg font-black text-emerald-300">{formatRate(rateStats.rentaiRate)}</div>
            </div>
            <div>
              <div className="flex items-center text-[10px] font-black text-slate-500 tracking-widest uppercase mb-1">
                <TrendingDown className="w-3 h-3 mr-1 text-rose-500" /> ラス率
              </div>
              <div className="font-mono text-lg font-black text-rose-300">{formatRate(rateStats.lastRate)}</div>
            </div>
            <div>
              <div className="flex items-center text-[10px] font-black text-slate-500 tracking-widest uppercase mb-1">
                <Skull className="w-3 h-3 mr-1 text-fuchsia-500" /> トビ率
              </div>
              <div className="font-mono text-lg font-black text-fuchsia-300">{formatRate(rateStats.tobiRate)}</div>
            </div>
          </div>
        </div>

        {rankCounts.some((c) => c > 0) && (
          <div className="relative z-10 bg-abyss/60 p-5 rounded-2xl border border-slate-800/80 mt-3">
            <div className="flex items-center text-[10px] font-black text-slate-500 tracking-widest uppercase mb-3">
              <BarChart3 className="w-3.5 h-3.5 mr-1.5 text-cyan-500" /> 着順分布
            </div>
            <RankCountBars counts={rankCounts} />
          </div>
        )}

        {yakumanAchievements.length > 0 && (
          <div className="relative z-10 bg-abyss/60 p-5 rounded-2xl border border-slate-800/80 mt-3">
            <div className="flex items-center text-[10px] font-black text-slate-500 tracking-widest uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-purple-400" /> 達成役満
            </div>
            <div className="space-y-2">
              {yakumanAchievements.map((a, i) => {
                const def = findYakuman(a.yakumanId);
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-panel-2/60 border border-purple-800/30 rounded-xl px-4 py-2.5"
                  >
                    <span className="font-bold text-purple-100 text-sm flex items-center">
                      {def?.name ?? a.yakumanId}
                      {def?.isDouble && <span className="ml-1.5 text-[8px] font-black text-purple-400 font-mono">W</span>}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{formatDate(a.date)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
