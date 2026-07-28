import type { ComponentType } from 'react';

export interface TabDef {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
}

export function TabNav({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: TabDef[];
  activeTab: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="relative mb-8">
      <div role="tablist" className="flex overflow-x-auto space-x-3 pb-4 scrollbar-hide snap-x relative">
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`snap-center flex items-center whitespace-nowrap px-4 sm:px-5 md:px-6 py-3 md:py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-500 relative overflow-hidden group shrink-0 ${
                isActive
                  ? 'text-cyan-50 bg-[#0a192f]/80 border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 bg-slate-900/40 border border-slate-800/80 hover:bg-slate-800/80 hover:text-cyan-200 hover:border-cyan-800/80'
              }`}
            >
              {isActive && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 mix-blend-overlay" />
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)]" />
                </>
              )}
              <Icon
                className={`w-4 h-4 mr-2 sm:mr-2.5 relative z-10 transition-all duration-300 ${
                  isActive
                    ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,1)] scale-110'
                    : 'group-hover:text-cyan-400/80 group-hover:scale-110'
                }`}
              />
              <span className="relative z-10 tracking-wider">{tab.name}</span>
            </button>
          );
        })}
      </div>
      <div className="pointer-events-none absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-abyss to-transparent md:hidden" />
    </div>
  );
}
