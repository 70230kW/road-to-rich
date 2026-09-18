import type { Player } from '../../types';
export function PlayerSelect({ players, value, onChange }: { players: Player[]; value: string; onChange: (id: string) => void }) {
  return <label className="player-select"><span className="eyebrow">PLAYER <span className="normal-case tracking-normal ml-2">表示する雀士</span></span>
    <select value={value} onChange={e => onChange(e.target.value)}>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
  </label>;
}
