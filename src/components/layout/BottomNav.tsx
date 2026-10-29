import type { ComponentType } from 'react';
import { Menu } from 'lucide-react';

export interface PrimaryTabDef {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
}

/** 主要タブ + 共通メニュー。表示数に合わせて等幅にする。 */
export function BottomNav({
  tabs,
  activeTab,
  isMoreActive,
  isMenuOpen,
  onChange,
  onOpenMore,
}: {
  tabs: PrimaryTabDef[];
  activeTab: string;
  isMoreActive: boolean;
  isMenuOpen: boolean;
  onChange: (id: string) => void;
  onOpenMore: () => void;
}) {
  return (
    <nav
      aria-label="メインナビゲーション"
      className="bottom-nav"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-5xl mx-auto grid" style={{ gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))` }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = !isMoreActive && activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onChange(tab.id)}
              className={`nav-item ${tab.id === 'input' ? 'nav-record' : ''} ${
                isActive ? 'is-active' : ''
              }`}
            >
              <Icon
                className="nav-icon"
              />
              <span className="nav-label">{tab.id === 'input' ? '対局を記録' : tab.name}</span>
            </button>
          );
        })}
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isMenuOpen}
          onClick={onOpenMore}
          className={`nav-item ${
            isMoreActive ? 'is-active' : ''
          }`}
        >
          <Menu
            className="nav-icon"
          />
          <span className="nav-label">メニュー</span>
        </button>
      </div>
    </nav>
  );
}
