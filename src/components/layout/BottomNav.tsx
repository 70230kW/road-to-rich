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
      role="tablist"
      aria-label="メインナビゲーション"
      className="fixed bottom-0 left-0 right-0 z-40 bg-panel/95 backdrop-blur-xl border-t border-cyan-900/40 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-md md:max-w-5xl mx-auto grid grid-cols-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = !isMoreActive && activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 sm:py-3 transition-colors ${
                isActive ? 'text-cyan-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon
                className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${
                  isActive ? 'scale-110 drop-shadow-[0_0_8px_rgb(var(--accent-rgb-500)/0.8)]' : ''
                }`}
              />
              <span className="text-[10px] sm:text-xs font-bold tracking-wide">{tab.name}</span>
            </button>
          );
        })}
        <button
          type="button"
          role="tab"
          aria-selected={isMoreActive}
          onClick={onOpenMore}
          className={`flex flex-col items-center justify-center gap-1 py-2.5 sm:py-3 transition-colors ${
            isMoreActive ? 'text-cyan-300' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <LayoutGrid
            className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${
              isMoreActive ? 'scale-110 drop-shadow-[0_0_8px_rgb(var(--accent-rgb-500)/0.8)]' : ''
            }`}
          />
          <span className="text-[10px] sm:text-xs font-bold tracking-wide">その他</span>
        </button>
      </div>
    </nav>
  );
}
