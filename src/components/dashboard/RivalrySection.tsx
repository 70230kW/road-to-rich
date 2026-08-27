import { useMemo, useState } from 'react';
import { ChevronDown, Swords } from 'lucide-react';
import type { DayRecord, Player } from '../../types';
import { computeHeadToHead } from '../../lib/rivalry';
import { formatSignedYen } from '../../lib/format';
import { EmptyState } from '../common/EmptyState';

export function RivalrySection({ history, players }: { history: DayRecord[]; players: Player[] }) {
  const [playerAId, setPlayerAId] = useState('');
  const [playerBId, setPlayerBId] = useState('');

  const stats = useMemo(() => {
    if (!playerAId || !playerBId || playerAId === playerBId) return null;
    return computeHeadToHead(history, playerAId, playerBId);
  }, [history, playerAId, playerBId]);

  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? '不明';

  return (
    <div className="bg-panel-2/80 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden group hover:border-rose-800/80 transition-colors duration-500 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <h3 className="text-sm font-black text-rose-400 mb-8 flex items-center tracking-[0.2em] uppercase">
        <Swords className="w-5 h-5 mr-2" /> ライバル対決
        <span className="text-slate-500 ml-2 font-normal text-xs normal-case">(Head-to-Head)</span>
      </h3>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 mb-6">
        <div className="relative min-w-0">
          <select
            value={playerAId}
            onChange={(e) => setPlayerAId(e.target.value)}
            className="w-full bg-abyss border border-slate-700/80 rounded-xl pl-3 sm:pl-4 pr-7 sm:pr-9 py-2.5 sm:py-3 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 font-bold appearance-none transition-all cursor-pointer text-xs sm:text-base truncate"
          >
            <option value="">雀士A</option>
            {players.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === playerBId}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/70 pointer-events-none" />
        </div>

        <span className="font-black text-slate-500 text-sm sm:text-base italic shrink-0">VS</span>

        <div className="relative min-w-0">
          <select
            value={playerBId}
            onChange={(e) => setPlayerBId(e.target.value)}
            className="w-full bg-abyss border border-slate-700/80 rounded-xl pl-3 sm:pl-4 pr-7 sm:pr-9 py-2.5 sm:py-3 text-slate-100 focus:outline-none focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/50 font-bold appearance-none transition-all cursor-pointer text-xs sm:text-base truncate"
          >
            <option value="">雀士B</option>
            {players.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === playerAId}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fuchsia-500/70 pointer-events-none" />
        </div>
      </div>

      {!stats ? (
        <EmptyState icon={Swords} message="Select Two Players" hint="2人の雀士を選ぶと、同卓した対局だけの直接対決成績が表示されます。" />
      ) : stats.sharedHanchanCount === 0 ? (
        <EmptyState
          icon={Swords}
          message="No Shared Games"
          hint={`${nameOf(playerAId)} と ${nameOf(playerBId)} が同卓した対局はまだありません。`}
        />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-abyss/80 p-5 rounded-2xl border border-cyan-800/50 text-center min-w-0">
              <div className="font-black text-slate-100 text-lg truncate mb-1">{nameOf(playerAId)}</div>
              <div className="font-mono text-4xl font-black text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">
                {stats.aWins}
              </div>
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">WINS</div>
            </div>
            <div className="bg-abyss/80 p-5 rounded-2xl border border-fuchsia-800/50 text-center min-w-0">
              <div className="font-black text-slate-100 text-lg truncate mb-1">{nameOf(playerBId)}</div>
              <div className="font-mono text-4xl font-black text-fuchsia-300 drop-shadow-[0_0_10px_rgba(232,121,249,0.6)]">
                {stats.bWins}
              </div>
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">WINS</div>
            </div>
          </div>

          <div className="h-3 rounded-full overflow-hidden flex bg-abyss border border-slate-800">
            <div
              className="bg-gradient-to-r from-cyan-600 to-cyan-400"
              style={{ width: `${(stats.aWins / stats.sharedHanchanCount) * 100}%` }}
            />
            <div
              className="bg-gradient-to-r from-fuchsia-400 to-fuchsia-600"
              style={{ width: `${(stats.bWins / stats.sharedHanchanCount) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between bg-abyss/60 px-5 py-4 rounded-2xl border border-slate-800/80">
            <span className="text-xs font-bold text-slate-400 tracking-wide">同卓対局数</span>
            <span className="font-mono font-black text-slate-200">{stats.sharedHanchanCount} 半荘</span>
          </div>

          <div className="flex items-center justify-between bg-abyss/60 px-5 py-4 rounded-2xl border border-slate-800/80">
            <span className="text-xs font-bold text-slate-400 tracking-wide">収支差（{nameOf(playerAId)} 基準）</span>
            <span
              className={`font-mono font-black text-lg ${stats.totalPointDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
            >
              {formatSignedYen(stats.totalPointDiff)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
