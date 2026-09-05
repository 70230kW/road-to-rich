import { useMemo, useState } from 'react';
import { ChevronDown, Swords } from 'lucide-react';
import type { DayRecord, Player } from '../../types';
import { computeGroupHeadToHead } from '../../lib/rivalry';
import { formatSignedYen } from '../../lib/format';
import { EmptyState } from '../common/EmptyState';

interface SlotTheme {
  text: string;
  border: string;
  bar: string;
  focus: string;
  icon: string;
  glow: string;
}

const SLOT_THEME: SlotTheme[] = [
  {
    text: 'text-cyan-300',
    border: 'border-cyan-800/50',
    bar: 'from-cyan-600 to-cyan-400',
    focus: 'focus:border-cyan-400 focus:ring-cyan-400/50',
    icon: 'text-cyan-500/70',
    glow: 'drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]',
  },
  {
    text: 'text-fuchsia-300',
    border: 'border-fuchsia-800/50',
    bar: 'from-fuchsia-400 to-fuchsia-600',
    focus: 'focus:border-fuchsia-400 focus:ring-fuchsia-400/50',
    icon: 'text-fuchsia-500/70',
    glow: 'drop-shadow-[0_0_10px_rgba(232,121,249,0.6)]',
  },
  {
    text: 'text-emerald-300',
    border: 'border-emerald-800/50',
    bar: 'from-emerald-600 to-emerald-400',
    focus: 'focus:border-emerald-400 focus:ring-emerald-400/50',
    icon: 'text-emerald-500/70',
    glow: 'drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]',
  },
  {
    text: 'text-yellow-300',
    border: 'border-yellow-800/50',
    bar: 'from-yellow-500 to-yellow-300',
    focus: 'focus:border-yellow-400 focus:ring-yellow-400/50',
    icon: 'text-yellow-500/70',
    glow: 'drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]',
  },
];

export function RivalrySection({ history, players }: { history: DayRecord[]; players: Player[] }) {
  const [playerCount, setPlayerCount] = useState(2);
  const [selectedIds, setSelectedIds] = useState<string[]>(['', '']);

  const setSlot = (index: number, id: string) => {
    setSelectedIds((prev) => {
      const next = [...prev];
      next[index] = id;
      return next;
    });
  };

  const changePlayerCount = (count: number) => {
    setPlayerCount(count);
    setSelectedIds((prev) => {
      const next = prev.slice(0, count);
      while (next.length < count) next.push('');
      return next;
    });
  };

  const activeIds = selectedIds.slice(0, playerCount);
  const allSelected = activeIds.every((id) => id !== '');
  const hasDuplicate = allSelected && new Set(activeIds).size !== activeIds.length;

  const stats = useMemo(() => {
    if (!allSelected || hasDuplicate) return null;
    return computeGroupHeadToHead(history, activeIds);
  }, [history, activeIds, allSelected, hasDuplicate]);

  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? '不明';
  const gridColsClass = playerCount > 2 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2';

  return (
    <div className="bg-panel-2/80 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden group hover:border-rose-800/80 transition-colors duration-500 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h3 className="text-sm font-black text-rose-400 flex items-center tracking-[0.2em] uppercase">
          <Swords className="w-5 h-5 mr-2 shrink-0" /> ライバル対決
          <span className="text-slate-500 ml-2 font-normal text-xs normal-case">(Head-to-Head)</span>
        </h3>
        <div className="flex items-center gap-1.5">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => changePlayerCount(n)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                playerCount === n
                  ? 'bg-rose-500/20 border-rose-400/60 text-rose-200'
                  : 'bg-panel-2/60 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {n}人
            </button>
          ))}
        </div>
      </div>

      <div className={`grid ${gridColsClass} gap-2 sm:gap-3 mb-6`}>
        {activeIds.map((id, i) => {
          const theme = SLOT_THEME[i];
          return (
            <div key={i} className="relative min-w-0">
              <select
                value={id}
                onChange={(e) => setSlot(i, e.target.value)}
                className={`w-full bg-abyss border border-slate-700/80 rounded-xl pl-3 sm:pl-4 pr-7 sm:pr-9 py-2.5 sm:py-3 text-slate-100 focus:outline-none focus:ring-1 font-bold appearance-none transition-all cursor-pointer text-xs sm:text-base truncate ${theme.focus}`}
              >
                <option value="">雀士{i + 1}</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id} disabled={activeIds.includes(p.id) && activeIds[i] !== p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className={`absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${theme.icon}`} />
            </div>
          );
        })}
      </div>

      {!allSelected ? (
        <EmptyState
          icon={Swords}
          message="Select Players"
          hint={`${playerCount}人の雀士を選ぶと、同卓した対局だけの直接対決成績が表示されます。`}
        />
      ) : hasDuplicate ? (
        <EmptyState icon={Swords} message="Duplicate Player" hint="同じ雀士を複数選ぶことはできません。それぞれ別の雀士を選んでください。" />
      ) : stats!.sharedHanchanCount === 0 ? (
        <EmptyState icon={Swords} message="No Shared Games" hint={`選択した${playerCount}人が同卓した対局はまだありません。`} />
      ) : (
        <div className="space-y-5">
          <div className={`grid ${gridColsClass} gap-4`}>
            {stats!.players.map((p, i) => {
              const theme = SLOT_THEME[i];
              return (
                <div key={p.playerId} className={`bg-abyss/80 p-5 rounded-2xl border ${theme.border} text-center min-w-0`}>
                  <div className="font-black text-slate-100 text-lg truncate mb-1">{nameOf(p.playerId)}</div>
                  <div className={`font-mono text-4xl font-black ${theme.text} ${theme.glow}`}>{p.wins}</div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">WINS</div>
                </div>
              );
            })}
          </div>

          <div className="h-3 rounded-full overflow-hidden flex bg-abyss border border-slate-800">
            {stats!.players.map((p, i) => (
              <div
                key={p.playerId}
                className={`bg-gradient-to-r ${SLOT_THEME[i].bar}`}
                style={{ width: `${(p.wins / stats!.sharedHanchanCount) * 100}%` }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between bg-abyss/60 px-5 py-4 rounded-2xl border border-slate-800/80">
            <span className="text-xs font-bold text-slate-400 tracking-wide">同卓対局数</span>
            <span className="font-mono font-black text-slate-200">{stats!.sharedHanchanCount} 半荘</span>
          </div>

          <div className="space-y-2">
            {stats!.players.map((p, i) => (
              <div
                key={p.playerId}
                className="flex items-center justify-between bg-abyss/60 px-5 py-4 rounded-2xl border border-slate-800/80"
              >
                <span className={`text-xs font-bold tracking-wide ${SLOT_THEME[i].text}`}>{nameOf(p.playerId)} の収支</span>
                <span
                  className={`font-mono font-black text-lg ${p.totalPoints >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                >
                  {formatSignedYen(p.totalPoints)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
