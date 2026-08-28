import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import { Bomb, Crown, Download, Flame, Gift, Skull, Sparkles, Swords, Trophy, X } from 'lucide-react';
import type { Player } from '../../types';
import type { SeasonReportData } from '../../lib/seasonReport';
import { formatDateShort, formatSignedYen } from '../../lib/format';

export function SeasonReportModal({
  seasonLabel,
  data,
  players,
  onClose,
}: {
  seasonLabel: string;
  data: SeasonReportData;
  players: Player[];
  onClose: () => void;
}) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const titledPlayers = players.filter((p) => data.titles[p.id]);

  const handleSave = async () => {
    if (!captureRef.current) return;
    setSaving(true);
    setSaveError(false);
    try {
      const dataUrl = await toPng(captureRef.current, { backgroundColor: '#0b1120', pixelRatio: 2 });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `road-to-rich-${seasonLabel}.png`;
      link.click();
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="season-report-title"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-[0_0_60px_rgba(232,121,249,0.2)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="absolute top-4 right-4 z-20 p-2 rounded-xl text-slate-300 bg-black/40 hover:text-white hover:bg-black/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div
          ref={captureRef}
          className="bg-[#0b1120] p-8 md:p-10 border border-fuchsia-500/30 relative overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-fuchsia-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 text-center mb-8">
            <div className="text-xs font-black text-slate-500 tracking-[0.3em] uppercase mb-1">Road to Rich</div>
            <h2
              id="season-report-title"
              className="text-3xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-cyan-300 tracking-wider"
            >
              {seasonLabel} シーズンレポート
            </h2>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-3 mb-6">
            <div className="bg-abyss/70 p-4 rounded-2xl border border-slate-800/80 text-center">
              <div className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-1">総半荘数</div>
              <div className="font-mono text-2xl font-black text-slate-100">{data.hanchanCount}</div>
            </div>
            <div className="bg-abyss/70 p-4 rounded-2xl border border-slate-800/80 text-center">
              <div className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-1">対局日数</div>
              <div className="font-mono text-2xl font-black text-slate-100">{data.dayCount}</div>
            </div>
          </div>

          {data.champion && (
            <div className="relative z-10 bg-gradient-to-br from-yellow-950/40 to-abyss/70 p-5 rounded-2xl border border-yellow-600/40 mb-6 text-center">
              <div className="flex items-center justify-center text-[10px] font-black text-yellow-500 tracking-widest uppercase mb-2">
                <Crown className="w-3.5 h-3.5 mr-1.5" /> 覇者
              </div>
              <div className="font-black text-2xl text-slate-100">{data.champion.playerName}</div>
              <div className="font-mono font-black text-emerald-400 mt-1">{formatSignedYen(data.champion.profit)}</div>
            </div>
          )}

          {titledPlayers.length > 0 && (
            <div className="relative z-10 mb-6">
              <div className="flex items-center text-[10px] font-black text-fuchsia-400 tracking-widest uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> 称号
              </div>
              <div className="space-y-1.5">
                {titledPlayers.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-abyss/60 border border-slate-800/80 rounded-xl px-4 py-2">
                    <span className="font-bold text-sm text-slate-200">{p.name}</span>
                    <span className="text-xs font-black text-fuchsia-300">{data.titles[p.id]?.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="relative z-10 mb-6">
            <div className="flex items-center text-[10px] font-black text-cyan-400 tracking-widest uppercase mb-3">
              <Trophy className="w-3.5 h-3.5 mr-1.5" /> トロフィー獲得数
            </div>
            <div className="grid grid-cols-2 gap-2">
              {players.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-abyss/60 border border-slate-800/80 rounded-xl px-3 py-2">
                  <span className="text-xs font-bold text-slate-300 truncate">{p.name}</span>
                  <span className="font-mono text-sm font-black text-cyan-300 shrink-0">{data.trophyCounts[p.id] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>

          {(data.hallOfFame.blowout || data.hallOfFame.comeback || data.hallOfFame.nailbiter || data.hallOfFame.bust) && (
            <div className="relative z-10 mb-6">
              <div className="flex items-center text-[10px] font-black text-emerald-400 tracking-widest uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> 名場面
              </div>
              <div className="space-y-1.5 text-xs">
                {data.hallOfFame.blowout && (
                  <div className="flex items-center justify-between bg-abyss/60 border border-slate-800/80 rounded-xl px-4 py-2">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Flame className="w-3 h-3 text-yellow-400" /> 快勝
                    </span>
                    <span className="font-bold text-slate-200">
                      {data.hallOfFame.blowout.playerName}（{formatDateShort(data.hallOfFame.blowout.date)}）
                    </span>
                  </div>
                )}
                {data.hallOfFame.nailbiter && (
                  <div className="flex items-center justify-between bg-abyss/60 border border-slate-800/80 rounded-xl px-4 py-2">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Swords className="w-3 h-3 text-cyan-400" /> 大接戦
                    </span>
                    <span className="font-bold text-slate-200">
                      {data.hallOfFame.nailbiter.playerName}（{formatDateShort(data.hallOfFame.nailbiter.date)}）
                    </span>
                  </div>
                )}
                {data.hallOfFame.comeback && (
                  <div className="flex items-center justify-between bg-abyss/60 border border-slate-800/80 rounded-xl px-4 py-2">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Sparkles className="w-3 h-3 text-emerald-400" /> 大逆転
                    </span>
                    <span className="font-bold text-slate-200">
                      {data.hallOfFame.comeback.playerName}（{formatDateShort(data.hallOfFame.comeback.date)}）
                    </span>
                  </div>
                )}
                {data.hallOfFame.bust && (
                  <div className="flex items-center justify-between bg-abyss/60 border border-slate-800/80 rounded-xl px-4 py-2">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Bomb className="w-3 h-3 text-rose-400" /> 大爆死
                    </span>
                    <span className="font-bold text-slate-200">
                      {data.hallOfFame.bust.playerName}（{formatDateShort(data.hallOfFame.bust.date)}）
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {(data.topVotedMvp || data.topVotedHanzai) && (
            <div className="relative z-10">
              <div className="flex items-center text-[10px] font-black text-yellow-400 tracking-widest uppercase mb-3">
                <Gift className="w-3.5 h-3.5 mr-1.5" /> みんなの投票
              </div>
              <div className="grid grid-cols-2 gap-2">
                {data.topVotedMvp && (
                  <div className="bg-abyss/60 border border-yellow-700/40 rounded-xl px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[9px] font-black text-yellow-500 uppercase mb-1">
                      <Crown className="w-3 h-3" /> MVP
                    </div>
                    <div className="font-bold text-sm text-slate-200">{data.topVotedMvp.playerName}</div>
                  </div>
                )}
                {data.topVotedHanzai && (
                  <div className="bg-abyss/60 border border-rose-700/40 rounded-xl px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[9px] font-black text-rose-500 uppercase mb-1">
                      <Skull className="w-3 h-3" /> 戦犯
                    </div>
                    <div className="font-bold text-sm text-slate-200">{data.topVotedHanzai.playerName}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#0b1120] border-t border-slate-800/80 p-4 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-500/40 hover:bg-fuchsia-500/25 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> {saving ? '保存中…' : '画像として保存'}
          </button>
          {saveError && <p className="text-xs text-rose-400">画像の保存に失敗しました。もう一度お試しください。</p>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
