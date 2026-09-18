import type { ComponentType } from 'react';
import { LayoutGrid } from 'lucide-react';

export interface PrimaryTabDef {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
}

/** 画面下部に固定される、主要4タブ + 「その他」メニューを開くボタン。 */
export function BottomNav({
  tabs,
  activeTab,
  isMoreActive,
  onChange,
  onOpenMore,
}: {
  tabs: PrimaryTabDef[];
  activeTab: string;
  isMoreActive: boolean;
  onChange: (id: string) => void;
  onOpenMore: () => void;
}) {
  return (
    <nav
      aria-label="メインナビゲーション"
      className="bottom-nav"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-5xl mx-auto grid grid-cols-5">
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
              <span className="text-[10px] sm:text-xs font-bold tracking-wide">{tab.name}</span>
            </button>
          );
        })}
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={onOpenMore}
          className={`nav-item ${
            isMoreActive ? 'is-active' : ''
          }`}
        >
          <LayoutGrid
            className="nav-icon"
          />
          <span className="text-[10px] sm:text-xs font-bold tracking-wide">その他</span>
        </button>
      </div>
    </nav>
  );
}

