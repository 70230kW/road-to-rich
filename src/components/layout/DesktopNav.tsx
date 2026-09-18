import type { PrimaryTabDef } from './BottomNav';
import { GlitchText } from '../common/GlitchText';
export function DesktopNav({ primary, other, activeTab, onSelect }: { primary: PrimaryTabDef[]; other: PrimaryTabDef[]; activeTab: string; onSelect: (id: string) => void }) {
  return <aside className="desktop-nav"><div className="desktop-wordmark"><span className="font-brand"><GlitchText text="じゃんかね" /></span><p className="eyebrow"><GlitchText text="ROAD TO RICH" /></p></div>
    <nav aria-label="デスクトップナビゲーション">{[primary, other].map((group,i) => <div key={i} className="desktop-nav-group"><p className="eyebrow">{i === 0 ? 'YOUR LEAGUE' : 'CAREER & SETTINGS'}</p>{group.map(tab => {const Icon=tab.icon;return <button key={tab.id} type="button" aria-current={activeTab===tab.id ? 'page' : undefined} className={tab.id==='input'?'desktop-record':''} onClick={() => onSelect(tab.id)}><Icon className="w-5 h-5"/><span>{tab.name}</span></button>;})}</div>)}</nav>
  </aside>;
}
