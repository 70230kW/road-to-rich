import type { PrimaryTabDef } from './BottomNav';
import { GlitchText } from '../common/GlitchText';
import { NAV_GROUPS } from './navGroups';

export function DesktopNav({ primary, other, activeTab, onSelect }: { primary: PrimaryTabDef[]; other: PrimaryTabDef[]; activeTab: string; onSelect: (id: string) => void }) {
  const tabs = [...primary, ...other];
  return <aside className="desktop-nav">
    <button type="button" className="desktop-wordmark" onClick={() => onSelect('top')} aria-label="じゃんかね TOPに戻る"><span className="font-brand"><GlitchText text="じゃんかね" /></span><small>牌メニュー（TOP）</small></button>
    <nav aria-label="デスクトップナビゲーション">{NAV_GROUPS.map(group => {
      const items = group.ids.flatMap(id => tabs.filter(tab => tab.id === id)).map(tab => { const Icon = tab.icon; return <button key={tab.id} type="button" aria-current={activeTab === tab.id ? 'page' : undefined} className={tab.id === 'input' ? 'desktop-record' : ''} onClick={() => onSelect(tab.id)}><Icon className="w-5 h-5"/><span>{tab.name}</span></button>; });
      return group.collapsible ? <details className="desktop-nav-group" key={`${group.label}-${activeTab}`} open={group.ids.includes(activeTab)}><summary>{group.label}</summary>{items}</details> : <div key={group.label} className="desktop-nav-group"><p className="nav-group-label">{group.label}</p>{items}</div>;
    })}</nav>
  </aside>;
}
