import type { ComponentType, ReactNode } from 'react';
import { GlitchText } from './GlitchText';
export function SectionHeader({ icon: Icon, title, trailing }: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  accent?: 'cyan' | 'fuchsia' | 'yellow' | 'emerald';
  trailing?: ReactNode;
}) {
  return <div className="section-heading"><div><p className="eyebrow">ROAD TO RICH / LEAGUE</p>
    <h2><Icon className="w-5 h-5 text-gold shrink-0" /><GlitchText text={title} /></h2></div>{trailing}</div>;
}
