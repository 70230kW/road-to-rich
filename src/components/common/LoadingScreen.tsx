import type { ReactNode } from 'react';
import { GlitchText } from './GlitchText';

/** Indeterminate loader; decoration never implies measured progress. */
export function LoadingScreen({ label = '読み込み中' }: { label?: ReactNode }) {
  return (
    <div className="cyber-loader" role="status" aria-live="polite" aria-atomic="true">
      <div className="cyber-loader-visual" aria-hidden="true">
        <div className="cyber-loader-aura" />
        <svg className="cyber-loader-hud" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="86" className="loader-guide" />
          <circle cx="100" cy="100" r="66" className="loader-guide loader-guide-inner" />
          {Array.from({ length: 32 }, (_, i) => (
            <path key={i} d={i % 4 === 0 ? 'M100 8V16' : 'M100 10V14'}
              transform={`rotate(${i * 11.25} 100 100)`} className={i % 4 === 0 ? 'loader-tick-major' : 'loader-tick'} />
          ))}
          <g className="loader-orbit loader-orbit-outer">
            <circle cx="100" cy="100" r="86" strokeDasharray="100 440" strokeLinecap="round" />
            <circle cx="186" cy="100" r="2.5" className="loader-orbit-node" />
          </g>
          <g className="loader-orbit loader-orbit-inner">
            <circle cx="100" cy="100" r="66" strokeDasharray="35 172" strokeLinecap="round" />
          </g>
          <path d="M25 51V25H51 M149 25H175V51 M175 149V175H149 M51 175H25V149" className="loader-brackets" />
        </svg>
        <div className="cyber-loader-core"><span>雀</span><div className="loader-core-scan" /></div>
        <span className="loader-coordinate loader-coordinate-left">R / R</span>
        <span className="loader-coordinate loader-coordinate-right">待機</span>
      </div>
      <div className="cyber-loader-copy">
        <div className="cyber-loader-brand font-brand" aria-hidden="true"><GlitchText text="じゃんかね" /></div>
        <p className="cyber-loader-caption" aria-hidden="true">ROAD TO RICH</p>
        <div className="cyber-loader-track" aria-hidden="true"><span /></div>
        <p className="cyber-loader-status"><span>{label}</span><span className="loader-activity" aria-hidden="true"><i /><i /><i /></span></p>
      </div>
    </div>
  );
}
