import type { ReactNode } from 'react';

/** Indeterminate loader; decoration never implies measured progress. */
export function LoadingScreen({ label = '読み込み中' }: { label?: ReactNode }) {
  return (
    <div className="gold-tile-loader" role="status" aria-live="polite" aria-atomic="true">
      <div className="gold-tile-stage" aria-hidden="true">
        <div className="gold-tile-bloom" />
        <div className="gold-tile">
          <svg className="gold-tile-outline" viewBox="0 0 112 142" fill="none">
            <rect x="2" y="2" width="108" height="138" rx="17" pathLength="1" />
            <path d="M18 121h76" pathLength="1" />
          </svg>
          <span className="gold-tile-glyph">雀</span>
          <span className="gold-tile-shine" />
        </div>
        <span className="gold-tile-shadow" />
      </div>
      <div className="gold-tile-copy">
        <div className="gold-tile-brand font-brand" aria-hidden="true">じゃんかね</div>
        <p className="gold-tile-caption" aria-hidden="true">ROAD TO RICH</p>
        <p className="gold-tile-status">{label}</p>
        <span className="gold-tile-activity" aria-hidden="true"><i /><i /><i /><i /></span>
      </div>
    </div>
  );
}
