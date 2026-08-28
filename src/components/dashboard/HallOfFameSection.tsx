import { useMemo } from 'react';
import { Bomb, Flame, Sparkles, Swords } from 'lucide-react';
import type { DayRecord, Player } from '../../types';
import { computeHallOfFame, type HallOfFameRecord } from '../../lib/hallOfFame';
import { formatDateShort } from '../../lib/format';

function RecordCard({
  icon: Icon,
  label,
  accent,
  record,
  formatValue,
  formatDetail,
}: {
  icon: typeof Flame;
  label: string;
  accent: string;
  record: HallOfFameRecord | null;
  formatValue: (record: HallOfFameRecord) => string;
  formatDetail?: (record: HallOfFameRecord) => string | null;
}) {
  return (
    <div className="bg-abyss/80 p-5 rounded-2xl border border-slate-800/80 min-w-0">
      <div className={`flex items-center text-[10px] font-black tracking-widest uppercase mb-2 ${accent}`}>
        <Icon className="w-3.5 h-3.5 mr-1.5 shrink-0" /> {label}
      </div>
      {record === null ? (
        <div className="text-sm text-slate-600 font-bold">記録なし</div>
      ) : (
        <>
          <div className="font-black text-lg text-slate-100 truncate">{record.playerName}</div>
          <div className={`font-mono font-black mt-1 ${accent}`}>{formatValue(record)}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-1.5 flex items-center justify-between gap-2">
            <span className="truncate">{formatDetail?.(record) ?? ''}</span>
            <span className="shrink-0">{formatDateShort(record.date)}</span>
          </div>
        </>
      )}
    </div>
  );
}

export function HallOfFameSection({ history, players }: { history: DayRecord[]; players: Player[] }) {
  const hallOfFame = useMemo(() => computeHallOfFame(history, players), [history, players]);
  const hasAnyRecord = hallOfFame.blowout || hallOfFame.comeback || hallOfFame.nailbiter || hallOfFame.bust;

  if (!hasAnyRecord) return null;

  return (
    <div className="bg-panel-2/80 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden group hover:border-fuchsia-800/80 transition-colors duration-500 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <h3 className="text-sm font-black text-fuchsia-400 mb-6 flex items-center tracking-[0.2em] uppercase">
        <Sparkles className="w-5 h-5 mr-2" /> 名場面ランキング
        <span className="text-slate-500 ml-2 font-normal text-xs normal-case">(Hall of Fame)</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RecordCard
          icon={Flame}
          label="快勝"
          accent="text-yellow-400"
          record={hallOfFame.blowout}
          formatValue={(r) => `${r.value.toLocaleString()}点差`}
          formatDetail={(r) => (r.opponentName ? `vs ${r.opponentName}` : null)}
        />
        <RecordCard
          icon={Swords}
          label="大接戦"
          accent="text-cyan-400"
          record={hallOfFame.nailbiter}
          formatValue={(r) => `${r.value.toLocaleString()}点差`}
          formatDetail={(r) => (r.opponentName ? `vs ${r.opponentName}` : null)}
        />
        <RecordCard
          icon={Sparkles}
          label="大逆転"
          accent="text-emerald-400"
          record={hallOfFame.comeback}
          formatValue={(r) => `${r.value > 0 ? '+' : ''}${r.value.toLocaleString()}点 差し返し`}
          formatDetail={(r) => (r.lowPoint !== undefined ? `最大 ${r.lowPoint.toLocaleString()}点 のビハインドから` : null)}
        />
        <RecordCard
          icon={Bomb}
          label="大爆死"
          accent="text-rose-400"
          record={hallOfFame.bust}
          formatValue={(r) => `${r.value.toLocaleString()}点`}
        />
      </div>
    </div>
  );
}
