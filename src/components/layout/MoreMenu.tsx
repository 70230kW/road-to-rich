import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { PrimaryTabDef } from './BottomNav';

/** 「その他」ボタンから開く、主要4タブに収まらない残りのタブ一覧。 */
export function MoreMenu({
  tabs,
  activeTab,
  onSelect,
  onClose,
}: {
  tabs: PrimaryTabDef[];
  activeTab: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const groups = [
    { label: 'キャリア', ids: ['rank', 'simulator', 'trophies'] },
    { label: 'リーグ管理', ids: ['players', 'rules', 'settings'] },
  ];
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-lg bg-panel border border-cyan-900/40 rounded-t-[2rem] sm:rounded-[2rem] p-6"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-cyan-400 tracking-[0.2em] uppercase">その他のメニュー</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-6">
          {groups.map((group) => <section key={group.label}><p className="more-menu-group-label">{group.label}</p><div className="grid grid-cols-3 gap-3">
          {tabs.filter((tab) => group.ids.includes(tab.id)).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelect(tab.id)}
                className={`flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border transition-colors ${
                  isActive
                    ? 'bg-cyan-500/10 border-cyan-400/50 text-cyan-300'
                    : 'bg-abyss/60 border-slate-800 text-slate-300 hover:border-slate-600'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-bold tracking-wide">{tab.name}</span>
              </button>
            );
          })}
          </div></section>)}
        </div>
      </div>
    </div>,
    document.body,
  );
}
