import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { Check, RefreshCw, Search, X } from 'lucide-react';
import type { PrimaryTabDef } from './BottomNav';

const MENU_GROUPS = [
  { label: 'メイン', ids: ['home', 'ranking', 'dashboard', 'input', 'history'] },
  { label: 'キャリア', ids: ['rank', 'simulator', 'trophies'] },
  { label: 'リーグ管理', ids: ['seasons', 'players', 'rules', 'settings'] },
  { label: 'アプリ情報', ids: ['updates'] },
] as const;

type RefreshState = 'idle' | 'refreshing' | 'success' | 'error';

/** 全ページへ移動できる、共通のハンバーガーメニュー。 */
export function MoreMenu({
  tabs,
  activeTab,
  onSelect,
  onRefresh,
  onClose,
}: {
  tabs: PrimaryTabDef[];
  activeTab: string;
  onSelect: (id: string) => void;
  onRefresh: () => Promise<void>;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState('');
  const visibleTabs = tabs.filter(tab => (tab.id === 'input' ? '対局を記録 精算' : tab.name).includes(query.trim()));
  const [refreshState, setRefreshState] = useState<RefreshState>('idle');

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const items = panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input');
        if (!items?.length) return;
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, [onClose]);

  const handleRefresh = async () => {
    if (refreshState === 'refreshing') return;
    setRefreshState('refreshing');
    try {
      await onRefresh();
      setRefreshState('success');
      resetTimer.current = setTimeout(() => setRefreshState('idle'), 900);
    } catch {
      setRefreshState('error');
    }
  };

  const RefreshIcon = refreshState === 'success' ? Check : RefreshCw;
  const refreshLabel = refreshState === 'refreshing'
    ? 'データを同期中…'
    : refreshState === 'success'
      ? '最新の状態です'
      : refreshState === 'error'
        ? '再試行する'
        : 'データを更新';

  return createPortal(
    <div className="navigation-menu-overlay">
      <button type="button" tabIndex={-1} className="navigation-menu-backdrop" onClick={onClose} aria-label="メニューを閉じる" />
      <aside ref={panelRef} className="navigation-menu-panel" role="dialog" aria-modal="true" aria-labelledby="navigation-menu-title">
        <header className="navigation-menu-header">
          <div>
            <p className="eyebrow">ROAD TO RICH</p>
            <h2 id="navigation-menu-title">メニュー</h2>
          </div>
          <button ref={closeButtonRef} type="button" className="icon-button" onClick={onClose} aria-label="メニューを閉じる">
            <X aria-hidden="true" />
          </button>
        </header>

        <label className="menu-search"><Search size={18} aria-hidden="true" /><input aria-label="メニューを検索" placeholder="機能を探す" value={query} onChange={event => setQuery(event.target.value)} /></label>
        <nav className="navigation-menu-scroll" aria-label="全画面ナビゲーション">
          {visibleTabs.length === 0 && <p role="status" className="hub-caption">一致する機能がありません。別の言葉で検索してください。</p>}
          {MENU_GROUPS.filter(group => visibleTabs.some(tab => group.ids.some(id => id === tab.id))).map((group) => (
            <section className="navigation-menu-group" key={group.label}>
              <p className="more-menu-group-label">{group.label}</p>
              <div className="navigation-menu-grid">
                {visibleTabs.filter((tab) => group.ids.some((id) => id === tab.id)).map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => onSelect(tab.id)}
                    >
                      <Icon className="navigation-menu-icon" />
                      <span>{tab.id === 'input' ? '対局を記録' : tab.name}</span>
                      {isActive && <i>表示中</i>}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        <footer className="navigation-menu-footer">
          <button type="button" onClick={() => void handleRefresh()} disabled={refreshState === 'refreshing'}>
            <RefreshIcon className={refreshState === 'refreshing' ? 'is-spinning' : ''} aria-hidden="true" />
            <span>{refreshLabel}</span>
          </button>
          <small>画面上端から下に引いても更新できます</small>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
