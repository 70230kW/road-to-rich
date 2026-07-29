import { useMemo, useState } from 'react';
import { Activity, ChevronsRight, DollarSign, Save } from 'lucide-react';
import type { DaySettlementEntry, DayRecord, Game, Player, Settings } from '../../types';
import { calcDaySettlement, isChipTotalBalanced } from '../../lib/calc';
import { formatSignedYen, formatYen } from '../../lib/format';
import { ErrorBanner } from '../common/ErrorBanner';
import { NeonButton } from '../common/NeonButton';

export function SettlementForm({
  players,
  settings,
  currentDayGames,
  onCancel,
  onSave,
}: {
  players: Player[];
  settings: Settings;
  currentDayGames: Game[];
  onCancel: () => void;
  onSave: (day: Omit<DayRecord, 'id' | 'date'>) => void;
}) {
  const participantIds = useMemo(() => {
    const seen = new Set<string>();
    currentDayGames.forEach((g) => g.scores.forEach((s) => seen.add(s.playerId)));
    return players.filter((p) => seen.has(p.id)).map((p) => p.id);
  }, [currentDayGames, players]);

  const [tableFeeInput, setTableFeeInput] = useState('');
  const [chipInputs, setChipInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(participantIds.map((id) => [id, ''])),
  );
  const [attemptedSave, setAttemptedSave] = useState(false);

  const tableFee = Number(tableFeeInput) || 0;
  const chips = useMemo(
    () => Object.fromEntries(participantIds.map((id) => [id, Number(chipInputs[id]) || 0])),
    [participantIds, chipInputs],
  );

  const chipsBalanced = isChipTotalBalanced(chips);
  const chipTotal = Object.values(chips).reduce((a, b) => a + b, 0);

  const settlement = useMemo(
    () => calcDaySettlement(currentDayGames, chips, tableFee, settings),
    [currentDayGames, chips, tableFee, settings],
  );

  const name = (id: string) => players.find((p) => p.id === id)?.name ?? '不明';

  const errorMessage = attemptedSave && !chipsBalanced
    ? `チップの合計が 0 になっていません（現在: ${chipTotal > 0 ? '+' : ''}${chipTotal}枚）。プラスマイナスゼロに調整してください。`
    : null;

  const handleSave = () => {
    setAttemptedSave(true);
    if (!chipsBalanced) return;
    onSave({
      games: currentDayGames,
      tableFee,
      chips,
      settlement,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-5 relative">
        <h2 className="text-2xl md:text-3xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 to-cyan-400 flex items-center tracking-wider">
          <DollarSign className="w-7 h-7 md:w-8 md:h-8 mr-3 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          本日の精算
        </h2>
        <div className="absolute -bottom-[1px] left-0 w-32 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent" />
      </div>

      <ErrorBanner message={errorMessage} />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-panel-2/80 p-6 rounded-3xl border border-slate-700/50 shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <label className="block text-xs font-black text-cyan-400 mb-4 tracking-[0.2em] uppercase flex items-center">
              <span className="w-2 h-2 rounded-full bg-cyan-400 mr-2 animate-pulse" />
              1日の総場代 (円)
            </label>
            <input
              type="number"
              value={tableFeeInput}
              onChange={(e) => setTableFeeInput(e.target.value)}
              className="w-full bg-abyss border border-slate-700 rounded-2xl px-5 py-4 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 font-mono text-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] transition-all"
              placeholder="0"
            />
            <p className="mt-3 text-xs text-slate-500">
              参加人数 {participantIds.length} 人で均等割（端数は切り上げ）します。
            </p>
          </div>

          <div className="bg-panel-2/80 p-6 rounded-3xl border border-slate-700/50 shadow-inner relative overflow-hidden">
            <label
              className={`block text-xs font-black mb-4 tracking-[0.2em] uppercase flex items-center ${
                chipsBalanced ? 'text-fuchsia-400' : 'text-rose-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full mr-2 animate-pulse ${chipsBalanced ? 'bg-fuchsia-400' : 'bg-rose-400'}`}
              />
              チップ精算 (±枚数)
              <span className="ml-auto font-mono normal-case tracking-normal text-[11px] text-slate-500">
                合計 {chipTotal > 0 ? '+' : ''}
                {chipTotal}枚
              </span>
            </label>
            <div className="space-y-3">
              {participantIds.map((pid) => (
                <div
                  key={pid}
                  className="flex items-center justify-between bg-abyss/80 p-3.5 rounded-2xl border border-slate-800/80 hover:border-slate-600 transition-colors"
                >
                  <span className="font-bold text-slate-200 tracking-wide pl-2">{name(pid)}</span>
                  <div className="relative">
                    <input
                      type="number"
                      value={chipInputs[pid] ?? ''}
                      onChange={(e) => setChipInputs({ ...chipInputs, [pid]: e.target.value })}
                      className={`w-28 bg-[#0a0f1d] border rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-1 font-mono text-right text-lg transition-all ${
                        !chipsBalanced && attemptedSave
                          ? 'border-rose-500/70 focus:border-rose-400 focus:ring-rose-400/50'
                          : 'border-slate-700 focus:border-fuchsia-400 focus:ring-fuchsia-400/50'
                      }`}
                      placeholder="0"
                    />
                    <span className="absolute right-[-24px] top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">
                      枚
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0f172a] to-[#070b14] p-6 md:p-8 rounded-3xl border border-slate-700/50 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[40px] rounded-full pointer-events-none" />
          <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 mb-6 tracking-[0.2em] uppercase flex items-center">
            <Activity className="w-5 h-5 mr-2 text-cyan-400" />
            最終精算結果プレビュー
          </h3>
          <div className="space-y-4">
            {participantIds.map((pid) => {
              const entry: DaySettlementEntry = settlement[pid];
              return (
                <div
                  key={pid}
                  className="bg-abyss/90 p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden group hover:border-cyan-900/50 transition-colors"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-blue-600 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="flex flex-col gap-3">
                    <span className="font-black text-slate-100 text-lg md:text-xl tracking-wider pl-2">
                      {name(pid)}
                    </span>

                    <div className="flex items-center justify-between gap-3 bg-[#0a0f1d] px-4 py-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">場代抜き</span>
                      <span
                        className={`font-mono font-black text-lg ${
                          entry.totalWithoutFee >= 0 ? 'text-slate-200' : 'text-rose-400'
                        }`}
                      >
                        {formatSignedYen(entry.totalWithoutFee)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 bg-[#0a0f1d] px-4 py-2.5 rounded-xl border border-cyan-900/50">
                      <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-1">
                        <ChevronsRight className="w-3 h-3" /> 場代込み（最終）
                      </span>
                      <span
                        className={`font-mono font-black text-2xl ${
                          entry.totalWithFee >= 0
                            ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]'
                            : 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                        }`}
                      >
                        {formatSignedYen(entry.totalWithFee)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono font-bold px-1">
                      <span className="text-slate-500">
                        半荘合計: <span className="text-slate-300">{formatSignedYen(entry.gamesTotal)}</span>
                      </span>
                      <span className="text-slate-500">
                        チップ: <span className="text-slate-300">{formatSignedYen(entry.chipValue)}</span>
                      </span>
                      <span className="text-slate-500">
                        場代: <span className="text-rose-400">-{formatYen(entry.tableFeeShare)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <NeonButton variant="ghost" onClick={onCancel} className="sm:w-1/3 text-lg">
          戻る
        </NeonButton>
        <NeonButton variant="success" onClick={handleSave} className="flex-1">
          <Save className="w-6 h-6 mr-3" />
          結果を保存する
        </NeonButton>
      </div>
    </div>
  );
}
