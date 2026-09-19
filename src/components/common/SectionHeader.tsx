import type { ComponentType, ReactNode } from 'react';
import { GlitchText } from './GlitchText';
export function SectionHeader({ icon: Icon, title, accent = 'cyan', description, trailing }: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  accent?: 'cyan' | 'fuchsia' | 'yellow' | 'emerald';
  description?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className={`section-heading section-heading-${accent}`}>
      <div className="section-heading-copy">
        <p className="eyebrow">ROAD TO RICH / LEAGUE</p>
        <h2>
          <span className="section-heading-icon"><Icon className="w-5 h-5 shrink-0" /></span>
          <GlitchText text={title} />
        </h2>
        {description && <p className="section-heading-description">{description}</p>}
      </div>
      {trailing}
    </div>
  );
}
