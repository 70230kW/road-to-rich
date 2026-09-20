import { createPortal } from 'react-dom';
import { useMemo, useRef, useState } from 'react';
import { Download, Image, Share2, X } from 'lucide-react';
import { formatSignedYen } from '../../lib/format';
import { haptic } from '../../lib/haptics';

type ShareFormat = 'square' | 'portrait' | 'wide';

export interface ShareResultRow {
  id: string;
  name: string;
  profit: number;
  color?: string;
}

const FORMATS: Array<{ id: ShareFormat; label: string }> = [
  { id: 'square', label: '1:1' },
  { id: 'portrait', label: '4:5' },
  { id: 'wide', label: '16:9' },
];

export function ResultShareButton({ title, date, rows, hanchanCount }: {
  title: string;
  date: string;
  rows: ShareResultRow[];
  hanchanCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ShareFormat>('portrait');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const sorted = useMemo(() => [...rows].sort((a, b) => b.profit - a.profit), [rows]);

  const exportImage = async () => {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    setError(null);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: '#0b0d10' });
      const blob = await (await fetch(dataUrl)).blob();
      const safeName = title.replace(/[^\p{L}\p{N}_-]+/gu, '-');
      const file = new File([blob], `${safeName || 'result'}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${title} リザルト` });
      } else {
        const link = document.createElement('a');
        link.download = file.name;
        link.href = dataUrl;
        link.click();
      }
      haptic('success');
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      setError('画像を作成できませんでした。少し待ってから再試行してください。');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <button type="button" className="share-result-trigger" onClick={() => setOpen(true)}><Share2 size={17} />リザルトカードを作る</button>
      {open && createPortal(
        <div className="share-result-overlay" role="dialog" aria-modal="true" aria-label="リザルトカードを作成">
          <button type="button" className="share-result-backdrop" aria-label="閉じる" onClick={() => setOpen(false)} />
          <div className="share-result-dialog">
            <header><div><span className="eyebrow">SHARE RESULT</span><h3>リザルトカード</h3></div><button type="button" aria-label="閉じる" onClick={() => setOpen(false)}><X size={20} /></button></header>
            <div className="share-format-switch" role="group" aria-label="画像の比率">{FORMATS.map((item) => <button key={item.id} type="button" aria-pressed={format === item.id} onClick={() => setFormat(item.id)}>{item.label}</button>)}</div>
            <div ref={cardRef} className={`result-share-card result-share-card-${format}`}>
              <div className="share-card-aura" />
              <div className="share-card-brand"><strong>じゃんかね</strong><span>ROAD TO RICH</span></div>
              <div className="share-card-title"><span>MATCH RESULT</span><h2>{title}</h2><p>{date} · {hanchanCount} HANCHANS</p></div>
              <div className="share-card-ranking">{sorted.map((row, index) => <div key={row.id}><span className="share-card-place">{String(index + 1).padStart(2, '0')}</span><i style={{ backgroundColor: row.color ?? '#d9bd82' }} /><strong>{row.name}</strong><em className={row.profit >= 0 ? 'is-positive' : 'is-negative'}>{formatSignedYen(row.profit)}</em></div>)}</div>
              <footer><span>FINAL SETTLEMENT</span><strong>{sorted[0]?.name ? `MVP — ${sorted[0].name}` : 'NO RESULT'}</strong></footer>
            </div>
            {error && <p className="share-result-error">{error}</p>}
            <button type="button" className="share-result-export" disabled={exporting} onClick={exportImage}>{typeof navigator.share === 'function' ? <Share2 size={18} /> : <Download size={18} />}{exporting ? '画像を作成中…' : '画像を共有・保存'}</button>
            <p className="share-result-hint"><Image size={13} />端末が共有に対応していない場合はPNGで保存します。</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
