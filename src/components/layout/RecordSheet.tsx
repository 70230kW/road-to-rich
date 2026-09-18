import { useEffect, useRef } from 'react';
import { Plus, Receipt, X } from 'lucide-react';

export function RecordSheet({ gameCount, onSelect, onClose }: { gameCount: number; onSelect: (settle: boolean) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={ref} className="record-sheet" aria-labelledby="record-title" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="section-kicker mb-6"><div><p className="eyebrow mb-2">RECORD YOUR GAME</p><h2 id="record-title" className="text-lg text-white">対局を記録</h2></div><button type="button" aria-label="閉じる" onClick={onClose} className="p-3"><X size={20} /></button></div>
    <button type="button" className="record-option" onClick={() => onSelect(false)}><Plus size={23} /><span><strong>半荘を記録</strong><small>参加者と素点を入力する</small></span></button>
    <button type="button" className="record-option" disabled={gameCount === 0} onClick={() => onSelect(true)}><Receipt size={23} /><span><strong>本日の精算</strong><small>{gameCount > 0 ? `${gameCount}半荘を精算して保存する` : '半荘を記録すると精算できます'}</small></span></button>
  </dialog>;
}
