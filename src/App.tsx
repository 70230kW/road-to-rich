import { DesktopNav } from './components/layout/DesktopNav';
import { PlayerContext } from './components/layout/PlayerContext';
import { RankPromotion } from './components/layout/RankPromotion';
import { lazy, Suspense, useState } from 'react';
import { BarChart3, BookOpen, Crown, Gauge, History, Plus, Settings as SettingsIcon, Telescope, Trophy, Users } from 'lucide-react';
import { Background } from './components/layout/Background';
import { RecordSheet } from './components/layout/RecordSheet';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/layout/Header';
import { BottomNav, type PrimaryTabDef } from './components/layout/BottomNav';
import { MoreMenu } from './components/layout/MoreMenu';
import { InputSection } from './components/input/InputSection';
import { RoomGate } from './components/room/RoomGate';
import { RoomBadge } from './components/room/RoomBadge';
import { LoadingScreen } from './components/common/LoadingScreen';


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

function TabLoading() {
  return <LoadingScreen label="読み込み中" />;
}

// 画面下部の固定ナビゲーションに収まる主要4タブ。残りは「その他」メニューにまとめる。
const PRIMARY_TABS: PrimaryTabDef[] = [
  { id: 'ranking', name: '順位表', icon: Crown },
  { id: 'dashboard', name: 'ダッシュボード', icon: BarChart3 },
  { id: 'input', name: '記録', icon: Plus },
  { id: 'history', name: '対戦履歴', icon: History },
];

const OTHER_TABS: PrimaryTabDef[] = [
  { id: 'rank', name: '段位', icon: Gauge },
  { id: 'simulator', name: '成績予想', icon: Telescope },
  { id: 'trophies', name: '実績', icon: Trophy },
  { id: 'rules', name: 'ルール', icon: BookOpen },
  { id: 'players', name: '雀士登録', icon: Users },
  { id: 'settings', name: '計算設定', icon: SettingsIcon },
];

function App() {
  return (
    <RoomGate>
      <AppShell />
    </RoomGate>
  );
}

function AppShell() {
  const [activeTab, setActiveTab] = useState<string>('ranking');
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [startSettling, setStartSettling] = useState(false);
  const [inputKey, setInputKey] = useState(0);
  const gameCount = useAppStore(s => s.currentDayGames.length);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const isMoreActive = OTHER_TABS.some((t) => t.id === activeTab);

  const selectTab = (id: string) => {
    setActiveTab(id);
    setIsMoreOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="min-h-screen bg-abyss text-slate-200 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative">
      <Background />

      <div className="app-workspace relative z-10">
        <DesktopNav primary={PRIMARY_TABS} other={OTHER_TABS} activeTab={activeTab} onSelect={id => id === 'input' ? setIsRecordOpen(true) : selectTab(id)} />
        <div className="app-content">
        <Header />
        <RoomBadge />
        <PlayerContext onRank={() => selectTab('rank')} />
        <RankPromotion />

        <main className="min-h-[500px] pt-5">
          <div key={activeTab} className="relative z-10 screen-transition">
            {activeTab === 'input' && <InputSection key={inputKey} startSettling={startSettling} onNavigateToPlayers={() => selectTab('players')} />}
            <Suspense fallback={<TabLoading />}>
              {activeTab === 'dashboard' && <DashboardSection />}
              {activeTab === 'history' && <HistorySection />}
              {activeTab === 'ranking' && <RankingSection />}
              {activeTab === 'rank' && <RankSection />}
              {activeTab === 'simulator' && <SimulatorSection />}
              {activeTab === 'trophies' && <TrophySection />}
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
        <MoreMenu tabs={OTHER_TABS} activeTab={activeTab} onSelect={selectTab} onClose={() => setIsMoreOpen(false)} />
      )}
    </div>
  );
}

export default App;

