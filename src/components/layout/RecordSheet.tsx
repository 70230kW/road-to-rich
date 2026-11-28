import { useEffect, useRef } from 'react';
import { CalendarDays, Plus, Receipt, X } from 'lucide-react';
import type { InputMode } from '../../lib/inputMode';

export function RecordSheet({ gameCount, hasSession = false, onSelect, onClose }: { gameCount: number; hasSession?: boolean; onSelect: (mode: InputMode) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={ref} className="record-sheet" aria-labelledby="record-title" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="section-kicker mb-6"><div><h2 id="record-title" className="text-lg text-white">対局入力</h2></div><button type="button" aria-label="閉じる" onClick={onClose} className="p-3"><X size={20} /></button></div>
    <button type="button" className="record-option" onClick={() => onSelect('single')}><Plus size={23} /><span><strong>{hasSession ? '次の半荘を記録' : '1半荘だけ記録'}</strong><small>{hasSession ? '進行中の対局会に追加する' : '対局会の設定なしで素点を入力する'}</small></span></button>
    <button type="button" className="record-option" onClick={() => onSelect('session')}><CalendarDays size={23} /><span><strong>{hasSession ? '対局会を再開' : '対局会を開始'}</strong><small>会の名前・参加メンバーを確認する</small></span></button>
    <button type="button" className="record-option" disabled={gameCount === 0} onClick={() => onSelect('settle')}><Receipt size={23} /><span><strong>本日の精算</strong><small>{gameCount > 0 ? `${gameCount}半荘を精算して保存する` : '半荘を記録すると精算できます'}</small></span></button>
  </dialog>;
}
