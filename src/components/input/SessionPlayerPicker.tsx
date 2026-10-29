import { useId, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Player } from '../../types';
import './sessionPlayerPicker.css';

const searchable = (value: string) => value.normalize('NFKC').toLocaleLowerCase('ja')
  .replace(/[ァ-ヶ]/g, character => String.fromCharCode(character.charCodeAt(0) - 0x60));

export function SessionPlayerPicker({ players, selectedIds, onChange, disabled = false }: {
  players: Player[]; selectedIds: string[]; onChange: (ids: string[]) => void; disabled?: boolean;
}) {
  const id = useId();
  const searchInput = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedOnly, setSelectedOnly] = useState(false);
  const selected = new Set(selectedIds);
  const selectedPlayers = players.filter(player => selected.has(player.id));
  const validIds = selectedPlayers.map(player => player.id);
  const search = searchable(query.trim());
  const visible = players.filter(player => (!selectedOnly || selected.has(player.id)) && searchable(player.name).includes(search));

  return <fieldset className="session-member-picker" disabled={disabled}>
    <legend className="sr-only">対局会の参加雀士</legend>
    <div className="session-member-heading">
      <span>参加メンバー</span>
      <span role="status" aria-live="polite" aria-atomic="true"><strong>{validIds.length}人</strong> 選択中 <small>/ {players.length}人</small></span>
    </div>
    {players.length === 0 ? <p className="session-member-empty">まだ雀士が登録されていません。雀士を登録すると、ここから参加メンバーを選べます。</p> : <>
      <div className="session-member-search">
        <Search size={17} aria-hidden="true" />
        <label htmlFor={`${id}-search`} className="sr-only">参加雀士を検索</label>
        <input ref={searchInput} id={`${id}-search`} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="雀士名で検索" autoComplete="off" />
        {query && <button type="button" aria-label="検索をクリア" onClick={() => { setQuery(''); searchInput.current?.focus(); }}><X size={16} aria-hidden="true" /></button>}
      </div>
      <div className="session-member-tools">
        <div><button type="button" onClick={() => onChange(players.map(player => player.id))} disabled={validIds.length === players.length}>全員を選択</button><button type="button" onClick={() => onChange([])} disabled={validIds.length === 0}>選択をクリア</button></div>
        <button type="button" aria-pressed={selectedOnly} onClick={() => setSelectedOnly(value => !value)}>選択済みのみ</button>
      </div>
      <div className="session-member-list" data-pull-ignore>
        {visible.map(player => <label key={player.id} className="session-member-row" data-selected={selected.has(player.id)}>
          <span className="session-member-color" style={{ backgroundColor: player.color }} aria-hidden="true" />
          <span className="session-member-name">{player.name}</span>
          <input type="checkbox" checked={selected.has(player.id)} onChange={event => onChange(event.target.checked ? [...validIds, player.id] : validIds.filter(value => value !== player.id))} />
        </label>)}
        {visible.length === 0 && <div className="session-member-empty"><p>{search ? '条件に合う雀士が見つかりません。' : 'まだ参加メンバーが選択されていません。'}</p>{selectedOnly && <button type="button" onClick={() => setSelectedOnly(false)}>すべての雀士を表示</button>}</div>}
      </div>
      <p className="session-member-note">{search || selectedOnly ? `${visible.length}人を表示中・非表示の雀士の選択も保持されます。` : '名前の行をタップして、参加・不参加を切り替え。'}</p>
    </>}
  </fieldset>;
}
