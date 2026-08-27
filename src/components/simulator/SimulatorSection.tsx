import { useMemo, useState } from 'react';
import { Crown, Rocket, Telescope, TrendingUp } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { computeCatchUpToLeader, computeSimulatorRows } from '../../lib/simulator';
import { filterHistoryBySeason, getAvailableSeasons, type SeasonFilter } from '../../lib/season';
import { formatSignedYen } from '../../lib/format';
import { SectionHeader } from '../common/SectionHeader';
import { SeasonSelect } from '../common/SeasonSelect';
import { EmptyState } from '../common/EmptyState';

const PRESET_HANCHAN_COUNTS = [10, 20, 50, 100];

export function SimulatorSection() {
  const fullHistory = useAppStore((s) => s.history);
  const players = useAppStore((s) => s.players);
  const [season, setSeason] = useState<SeasonFilter>('all');
  const seasons = useMemo(() => getAvailableSeasons(fullHistory), [fullHistory]);
  const history = useMemo(() => filterHistoryBySeason(fullHistory, season), [fullHistory, season]);
  const [futureHanchans, setFutureHanchans] = useState(20);

  const seasonSelect = <SeasonSelect season={season} onChange={setSeason} seasons={seasons} accent="fuchsia" />;

  const rows = useMemo(() => computeSimulatorRows(history, players, futureHanchans), [history, players, futureHanchans]);
  const catchUpRows = useMemo(() => computeCatchUpToLeader(history, players), [history, players]);
  const leaderName = rows[0]?.name ?? null;

  if (history.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader
          icon={Telescope}
          title="成績予想"
          accent="fuchsia"
          trailing={fullHistory.length > 0 ? seasonSelect : undefined}
        />
        <EmptyState icon={Telescope} message="No Data" hint="対局を記録して精算を保存すると、ここで今後の成績を予測できます。" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeader icon={Telescope} title="成績予想" accent="fuchsia" trailing={seasonSelect} />

      <div className="bg-panel-2/80 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h3 className="text-sm font-black text-fuchsia-400 flex items-center tracking-[0.2em] uppercase">
            <TrendingUp className="w-5 h-5 mr-2" /> 今後の予測
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_HANCHAN_COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setFutureHanchans(n)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  futureHanchans === n
                    ? 'bg-fuchsia-500/20 border-fuchsia-400/60 text-fuchsia-200'
                    : 'bg-abyss border-slate-700/80 text-slate-400 hover:border-fuchsia-700/60'
                }`}
              >
                {n}半荘
              </button>
            ))}
            <input
              type="number"
              min={0}
              max={9999}
              value={futureHanchans}
              onChange={(e) => setFutureHanchans(Math.max(0, Math.min(9999, Number(e.target.value) || 0)))}
              aria-label="今後の半荘数"
              className="w-20 bg-abyss border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs font-mono font-bold text-center focus:outline-none focus:border-fuchsia-400"
            />
            <span className="text-xs text-slate-500 font-bold">半荘後</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500 text-[10px] uppercase tracking-widest">
              <tr>
                <th className="pb-3 pr-3 font-black">雀士</th>
                <th className="pb-3 pr-3 font-black text-right">現在収支</th>
                <th className="pb-3 pr-3 font-black text-right">平均収支/半荘</th>
                <th className="pb-3 font-black text-right">{futureHanchans}半荘後の予測</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {rows.map((row, idx) => (
                <tr key={row.playerId} className="border-t border-slate-800/80">
                  <td className="py-3 pr-3 font-sans font-bold text-slate-100 flex items-center gap-1.5">
                    {idx === 0 && <Crown className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                    {row.name}
                  </td>
                  <td className={`py-3 pr-3 text-right ${row.currentProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatSignedYen(row.currentProfit)}
                  </td>
                  <td className="py-3 pr-3 text-right text-slate-400">
                    {row.avgProfitPerHanchan !== null ? formatSignedYen(Math.round(row.avgProfitPerHanchan)) : '-'}
                  </td>
                  <td
                    className={`py-3 text-right font-black ${
                      row.projectedProfit === null
                        ? 'text-slate-600'
                        : row.projectedProfit >= 0
                          ? 'text-emerald-300'
                          : 'text-rose-300'
                    }`}
                  >
                    {row.projectedProfit !== null ? formatSignedYen(Math.round(row.projectedProfit)) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-slate-600 mt-4">
          ※ 各雀士のこれまでの平均収支ペースがそのまま続くと仮定した単純な試算です。実際の結果を保証するものではありません。
        </p>
      </div>

      <div className="bg-panel-2/80 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <h3 className="text-sm font-black text-fuchsia-400 mb-6 flex items-center tracking-[0.2em] uppercase">
          <Rocket className="w-5 h-5 mr-2" /> トップまでの道のり
        </h3>
        {catchUpRows.length === 0 ? (
          <EmptyState icon={Rocket} message="Not Enough Data" hint="2人以上の対局実績が揃うと、首位までの試算が表示されます。" />
        ) : (
          <div className="space-y-3">
            {catchUpRows.map((row) => (
              <div
                key={row.playerId}
                className="flex items-center justify-between gap-4 bg-abyss/60 px-5 py-4 rounded-2xl border border-slate-800/80"
              >
                <span className="font-bold text-slate-200">{row.name}</span>
                {row.hanchansNeeded === null ? (
                  <span className="text-xs text-slate-500 font-bold text-right">
                    現在のペースでは {leaderName} 選手に追いつくのは難しいかも…
                  </span>
                ) : row.hanchansNeeded === 0 ? (
                  <span className="text-sm font-black text-yellow-300">現在ほぼ横並び！</span>
                ) : (
                  <span className="text-sm font-black text-fuchsia-300">
                    あと約 <span className="text-lg">{row.hanchansNeeded}</span> 半荘で追いつけるかも
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
