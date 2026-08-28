import { Crown, Skull } from 'lucide-react';
import type { DayVotes as DayVotesData, Player } from '../../types';

function VoteList({
  participantIds,
  players,
  counts,
  onVote,
  activeClass,
  buttonClass,
}: {
  participantIds: string[];
  players: Player[];
  counts: Record<string, number>;
  onVote: (playerId: string) => void;
  activeClass: string;
  buttonClass: string;
}) {
  const name = (id: string) => players.find((p) => p.id === id)?.name ?? '不明';
  const max = Math.max(0, ...participantIds.map((id) => counts[id] ?? 0));

  return (
    <div className="space-y-2">
      {participantIds.map((pid) => {
        const count = counts[pid] ?? 0;
        const isLeader = count > 0 && count === max;
        return (
          <button
            key={pid}
            type="button"
            onClick={() => onVote(pid)}
            className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border transition-colors ${
              isLeader ? activeClass : 'bg-abyss/60 border-slate-700/60 hover:border-slate-500/60'
            }`}
          >
            <span className="font-bold text-sm text-slate-200 truncate">{name(pid)}</span>
            <span className={`font-mono text-xs font-black shrink-0 ${buttonClass}`}>{count}票</span>
          </button>
        );
      })}
    </div>
  );
}

export function DayVotes({
  participantIds,
  players,
  votes,
  onVote,
}: {
  participantIds: string[];
  players: Player[];
  votes: DayVotesData | undefined;
  onVote: (category: 'mvp' | 'hanzai', playerId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <div className="flex items-center text-[10px] font-black text-yellow-400 tracking-widest uppercase mb-2.5">
          <Crown className="w-3.5 h-3.5 mr-1.5" /> 本日のMVP
        </div>
        <VoteList
          participantIds={participantIds}
          players={players}
          counts={votes?.mvp ?? {}}
          onVote={(pid) => onVote('mvp', pid)}
          activeClass="bg-yellow-500/10 border-yellow-500/50"
          buttonClass="text-yellow-300"
        />
      </div>
      <div>
        <div className="flex items-center text-[10px] font-black text-rose-400 tracking-widest uppercase mb-2.5">
          <Skull className="w-3.5 h-3.5 mr-1.5" /> 本日の戦犯
        </div>
        <VoteList
          participantIds={participantIds}
          players={players}
          counts={votes?.hanzai ?? {}}
          onVote={(pid) => onVote('hanzai', pid)}
          activeClass="bg-rose-500/10 border-rose-500/50"
          buttonClass="text-rose-300"
        />
      </div>
    </div>
  );
}
