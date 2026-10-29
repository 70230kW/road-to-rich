import { DesktopNav } from './components/layout/DesktopNav';
import { PlayerContext } from './components/layout/PlayerContext';
import { RankPromotion } from './components/layout/RankPromotion';
import { lazy, Suspense, useCallback, useState } from 'react';
import { ArrowLeft, BarChart3, BookOpen, CalendarRange, Crown, Gauge, History, House, Plus, ScrollText, Settings as SettingsIcon, Telescope, Trophy, Users } from 'lucide-react';
import { Background } from './components/layout/Background';
import { RecordSheet } from './components/layout/RecordSheet';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/layout/Header';
import { BottomNav, type PrimaryTabDef } from './components/layout/BottomNav';
import { MoreMenu } from './components/layout/MoreMenu';
import { RoomGate } from './components/room/RoomGate';
import { RoomBadge } from './components/room/RoomBadge';
import { TabSkeleton } from './components/common/TabSkeleton';
import { WelcomeGuide } from './components/layout/WelcomeGuide';
import { OnlineStatusBar } from './components/layout/OnlineStatusBar';
import { PullToRefresh } from './components/layout/PullToRefresh';


// Secondary screens are loaded on demand.
const DashboardSection = lazy(() =>
  import('./components/dashboard/DashboardSection').then((m) => ({ default: m.DashboardSection })),
);
const HistorySection = lazy(() =>
  import('./components/history/HistorySection').then((m) => ({ default: m.HistorySection })),
);
const RankingSection = lazy(() =>
  import('./components/ranking/RankingSection').then((m) => ({ default: m.RankingSection })),
);
const SettingsSection = lazy(() =>
  import('./components/settings/SettingsSection').then((m) => ({ default: m.SettingsSection })),
);
const PlayerSection = lazy(() =>
  import('./components/players/PlayerSection').then((m) => ({ default: m.PlayerSection })),
);
const RulesSection = lazy(() =>
  import('./components/rules/RulesSection').then((m) => ({ default: m.RulesSection })),
);
const TrophySection = lazy(() =>
  import('./components/trophies/TrophySection').then((m) => ({ default: m.TrophySection })),
);
const SimulatorSection = lazy(() =>
  import('./components/simulator/SimulatorSection').then((m) => ({ default: m.SimulatorSection })),
);
const RankSection = lazy(() => import('./components/rank/RankSection').then((m) => ({ default: m.RankSection })));
const InputSection = lazy(() => import('./components/input/InputSection').then((m) => ({ default: m.InputSection })));
const SeasonArchiveSection = lazy(() => import('./components/seasons/SeasonArchiveSection').then((m) => ({ default: m.SeasonArchiveSection })));
const UpdateHistorySection = lazy(() => import('./components/updates/UpdateHistorySection').then((m) => ({ default: m.UpdateHistorySection })));
const LeagueHomeSection = lazy(() => import('./components/home/LeagueHomeSection').then((m) => ({ default: m.LeagueHomeSection })));
const TopSection = lazy(() => import('./components/home/TopSection').then((m) => ({ default: m.TopSection })));

// 画面下部の固定ナビゲーションに収まる主要4タブ。全画面は共通メニューからも移動できる。
const PRIMARY_TABS: PrimaryTabDef[] = [
  { id: 'top', name: 'TOP', icon: House },
  { id: 'ranking', name: '順位表', icon: Crown },
  { id: 'input', name: '記録', icon: Plus },
  { id: 'history', name: '対戦履歴', icon: History },
];

const OTHER_TABS: PrimaryTabDef[] = [
  { id: 'home', name: 'リーグホーム', icon: House },
  { id: 'dashboard', name: 'ダッシュボード', icon: BarChart3 },
  { id: 'rank', name: '段位', icon: Gauge },
  { id: 'simulator', name: '成績予想', icon: Telescope },
  { id: 'trophies', name: '実績', icon: Trophy },
  { id: 'seasons', name: 'シーズン', icon: CalendarRange },
  { id: 'updates', name: 'アプデ', icon: ScrollText },
  { id: 'rules', name: 'ルール', icon: BookOpen },
  { id: 'players', name: '雀士登録', icon: Users },
  { id: 'settings', name: '計算設定', icon: SettingsIcon },
];

const ALL_TABS: PrimaryTabDef[] = [...PRIMARY_TABS, ...OTHER_TABS];

function App() {
  return (
    <RoomGate>
      <AppShell />
    </RoomGate>
  );
}

export function AppShell() {
  const [activeTab, setActiveTab] = useState<string>('top');
  const [homeMenuIndex, setHomeMenuIndex] = useState(0);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [startSettling, setStartSettling] = useState(false);
  const [inputKey, setInputKey] = useState(0);
  const gameCount = useAppStore(s => s.currentDayGames.length);
  const refreshRoom = useAppStore(s => s.refreshRoom);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(() => {
    try { return localStorage.getItem('road-to-rich-welcome-v1') !== 'seen'; } catch { return false; }
  });
  const isMoreActive = OTHER_TABS.some((t) => t.id === activeTab);

  const selectTab = useCallback((id: string) => {
    setActiveTab(id);
    setIsMoreOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  const closeMenu = useCallback(() => setIsMoreOpen(false), []);
  const selectMenuTab = useCallback((id: string) => {
    if (id === 'input') {
      setIsMoreOpen(false);
      setIsRecordOpen(true);
      return;
    }
    selectTab(id);
  }, [selectTab]);

  // TOP is a separate, viewport-sized scene, not a page inside the league shell.
  if (activeTab === 'top') return (
    <main className="top-viewport">
      <Suspense fallback={<span className="sr-only" role="status">TOPを読み込み中</span>}>
        <TopSection menuIndex={homeMenuIndex} onMenuChange={setHomeMenuIndex} onOpenMatch={() => { setStartSettling(false); setInputKey(key => key + 1); selectTab('input'); }} onNavigate={selectTab} />
      </Suspense>
    </main>
  );

  return (
    <PullToRefresh onRefresh={refreshRoom}>
      <div className="min-h-screen bg-abyss text-slate-200 font-sans selection:bg-cyan-500/30 overflow-x-clip relative">
        <Background />
        <OnlineStatusBar />

        <div className="app-workspace relative z-10">
          <DesktopNav primary={PRIMARY_TABS} other={OTHER_TABS} activeTab={activeTab} onSelect={id => id === 'input' ? setIsRecordOpen(true) : selectTab(id)} />
          <div className="app-content">
            <Header playerSelect={<PlayerContext />} onOpenMenu={() => setIsMoreOpen(true)} />
            <RoomBadge />
            <RankPromotion />

            <main className="min-h-[500px] pt-5">
              {activeTab !== 'top' && <button type="button" className="top-return-button" onClick={() => selectTab('top')}><ArrowLeft size={17} aria-hidden="true" />TOPに戻る</button>}
              <div key={activeTab} className="relative z-10 screen-transition">
                <Suspense fallback={<TabSkeleton tab={activeTab} />}>
                  {activeTab === 'input' && <InputSection key={inputKey} startSettling={startSettling} onNavigateToPlayers={() => selectTab('players')} onResultComplete={() => selectTab('top')} />}
                  {activeTab === 'home' && <LeagueHomeSection onOpenRecord={() => setIsRecordOpen(true)} onOpenMatch={() => { setStartSettling(false); setInputKey(key => key + 1); selectTab('input'); }} onNavigate={selectTab} />}
                  {activeTab === 'dashboard' && <DashboardSection />}
                  {activeTab === 'history' && <HistorySection />}
                  {activeTab === 'ranking' && <RankingSection />}
                  {activeTab === 'rank' && <RankSection />}
                  {activeTab === 'simulator' && <SimulatorSection />}
                  {activeTab === 'trophies' && <TrophySection />}
                  {activeTab === 'seasons' && <SeasonArchiveSection />}
                  {activeTab === 'updates' && <UpdateHistorySection />}
                  {activeTab === 'settings' && <SettingsSection />}
                  {activeTab === 'players' && <PlayerSection />}
                  {activeTab === 'rules' && <RulesSection />}
                </Suspense>
              </div>
            </main>

            <footer className="text-center py-8 text-[10px] text-slate-700 font-mono tracking-[0.2em] uppercase">
              じゃんかね — Provided by K.Waga
            </footer>
          </div>
        </div>

        <BottomNav
          tabs={PRIMARY_TABS}
          activeTab={activeTab}
          isMoreActive={isMoreActive}
          isMenuOpen={isMoreOpen}
          onChange={id => id === 'input' ? setIsRecordOpen(true) : selectTab(id)}
          onOpenMore={() => setIsMoreOpen(true)}
        />

        {isRecordOpen && <RecordSheet gameCount={gameCount} onClose={() => setIsRecordOpen(false)} onSelect={settle => {
          setStartSettling(settle);
          setInputKey(key => key + 1);
          setIsRecordOpen(false);
          selectTab('input');
        }} />}

        {isMoreOpen && (
          <MoreMenu tabs={ALL_TABS} activeTab={activeTab} onSelect={selectMenuTab} onRefresh={refreshRoom} onClose={closeMenu} />
        )}
        {showGuide && <WelcomeGuide onClose={() => { try { localStorage.setItem('road-to-rich-welcome-v1', 'seen'); } catch { /* non-persistent sessions remain usable */ } setShowGuide(false); }} />}
      </div>
    </PullToRefresh>
  );
}

export default App;
