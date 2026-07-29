import { ChevronDown, Settings as SettingsIcon } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { PlayerCount } from '../../types';
import { getRankPoints } from '../../lib/calc';
import { SectionHeader } from '../common/SectionHeader';
import { ErrorBanner } from '../common/ErrorBanner';

export function SettingsSection() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const currentDayGamesCount = useAppStore((s) => s.currentDayGames.length);

  const hasUnsavedDay = currentDayGamesCount > 0;
  const activeRankPoints = getRankPoints(settings);
  const rankSum = activeRankPoints.reduce((a, b) => a + b, 0);

  const handleRankChange = (idx: number, value: string) => {
    const n = Number(value) || 0;
    if (settings.playerCount === 4) {
      const next = [...settings.rankPoints4] as [number, number, number, number];
      next[idx] = n;
      updateSettings({ rankPoints4: next });
    } else {
      const next = [...settings.rankPoints3] as [number, number, number];
      next[idx] = n;
      updateSettings({ rankPoints3: next });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeader icon={SettingsIcon} title="計算設定" accent="cyan" />

      {hasUnsavedDay && (
        <ErrorBanner message="本日、未精算の半荘記録があるため「対局形式」は変更できません。先に精算を保存するか、記録を削除してください。" />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-panel-2/60 p-6 rounded-[2rem] border border-slate-700/50 hover:border-cyan-800/80 transition-all duration-300 backdrop-blur-sm group">
          <label className="block text-xs font-black text-slate-400 mb-3 tracking-[0.15em] uppercase group-hover:text-cyan-400 transition-colors">
            対局形式
          </label>
          <div className="relative">
            <select
              value={settings.playerCount}
              disabled={hasUnsavedDay}
              onChange={(e) => updateSettings({ playerCount: Number(e.target.value) as PlayerCount })}
              className="w-full bg-abyss border border-slate-700/80 rounded-xl px-5 py-4 text-slate-100 appearance-none focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 font-bold tracking-wider cursor-pointer shadow-inner transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value={4}>四人麻雀</option>
              <option value={3}>三人麻雀</option>
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500/70 pointer-events-none" />
          </div>
        </div>

        <div className="bg-panel-2/60 p-6 rounded-[2rem] border border-slate-700/50 hover:border-cyan-800/80 transition-all duration-300 backdrop-blur-sm group">
          <label className="block text-xs font-black text-slate-400 mb-3 tracking-[0.15em] uppercase group-hover:text-cyan-400 transition-colors">
            配給原点（返しの点）
          </label>
          <input
            type="number"
            value={settings.initialScore}
            onChange={(e) => updateSettings({ initialScore: Number(e.target.value) || 0 })}
            className="w-full bg-abyss border border-slate-700/80 rounded-xl px-5 py-4 text-cyan-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 font-mono text-lg shadow-inner transition-all"
          />
        </div>

        <div className="bg-panel-2/60 p-6 rounded-[2rem] border border-slate-700/50 hover:border-cyan-800/80 transition-all duration-300 backdrop-blur-sm group">
          <label className="block text-xs font-black text-slate-400 mb-3 tracking-[0.15em] uppercase group-hover:text-cyan-400 transition-colors">
            チップ1枚の金額（円）
          </label>
          <div className="relative">
            <input
              type="number"
              value={settings.chipValue}
              onChange={(e) => updateSettings({ chipValue: Number(e.target.value) || 0 })}
              className="w-full bg-abyss border border-slate-700/80 rounded-xl pl-5 pr-12 py-4 text-cyan-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 font-mono text-lg shadow-inner transition-all"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-500 pointer-events-none">円</span>
          </div>
        </div>

        <div className="bg-panel-2/60 p-6 rounded-[2rem] border border-slate-700/50 hover:border-cyan-800/80 transition-all duration-300 backdrop-blur-sm group">
          <label className="block text-xs font-black text-slate-400 mb-3 tracking-[0.15em] uppercase group-hover:text-cyan-400 transition-colors">
            割る数（レート相当）
          </label>
          <input
            type="number"
            value={settings.divider}
            onChange={(e) => updateSettings({ divider: Number(e.target.value) || 1 })}
            className="w-full bg-abyss border border-slate-700/80 rounded-xl px-5 py-4 text-cyan-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 font-mono text-lg shadow-inner transition-all"
          />
        </div>
      </div>

      <div className="bg-panel-2/60 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 hover:border-cyan-800/80 transition-all duration-300 backdrop-blur-sm mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <label className="text-sm font-black text-cyan-400 tracking-[0.2em] uppercase flex items-center">
            <span className="w-2 h-2 rounded-full bg-cyan-400 mr-2 shadow-[0_0_8px_rgba(34,211,238,1)]" />
            順位点（ウマ・オカ込み）
          </label>
          <span
            className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
              rankSum === 0
                ? 'text-emerald-400 border-emerald-800/60 bg-emerald-950/20'
                : 'text-amber-400 border-amber-800/60 bg-amber-950/20'
            }`}
          >
            合計 {rankSum > 0 ? '+' : ''}
            {rankSum} {rankSum !== 0 && '（通常は 0 になるよう設定します）'}
          </span>
        </div>
        <div className={`grid gap-4 md:gap-6 ${settings.playerCount === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'}`}>
          {activeRankPoints.map((value, idx) => (
            <div key={idx} className="bg-abyss p-4 rounded-2xl border border-slate-700/80 shadow-inner">
              <span className="text-xs font-black text-slate-500 block mb-3 tracking-[0.2em] uppercase text-center">{idx + 1}着</span>
              <input
                type="number"
                value={value}
                onChange={(e) => handleRankChange(idx, e.target.value)}
                className="w-full bg-[#0a192f] border border-slate-700 rounded-xl px-3 py-3 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 font-mono text-lg text-center transition-all"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
