import { lazy, Suspense, useState } from 'react';
import { BarChart3, BookOpen, Crown, Gauge, History, Plus, Settings as SettingsIcon, Telescope, Trophy, Users } from 'lucide-react';
import { Background } from './components/layout/Background';
import { Header } from './components/layout/Header';
import { TabNav, type TabDef } from './components/layout/TabNav';
import { InputSection } from './components/input/InputSection';
import { RoomGate } from './components/room/RoomGate';
import { RoomBadge } from './components/room/RoomBadge';
import { LoadingScreen } from './components/common/LoadingScreen';
import { RippleLayer } from './components/common/RippleLayer';

// Only the default "input" tab loads eagerly; the rest are fetched on first
// visit so the initial bundle (and time-to-interactive) stays small.
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

const TABS: TabDef[] = [
  { id: 'input', name: '成績入力・精算', icon: Plus },
  { id: 'ranking', name: 'ランキング', icon: Crown },
  { id: 'rank', name: '段位', icon: Gauge },
  { id: 'dashboard', name: 'ダッシュボード', icon: BarChart3 },
  { id: 'simulator', name: '成績予想', icon: Telescope },
  { id: 'trophies', name: 'トロフィー', icon: Trophy },
  { id: 'history', name: '対戦履歴', icon: History },
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
  const [activeTab, setActiveTab] = useState<string>('input');

  return (
    <div className="min-h-screen bg-abyss text-slate-200 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative">
      <Background />
      <RippleLayer />

      <div className="max-w-md md:max-w-5xl mx-auto p-4 md:p-6 relative z-10">
        <Header />
        <RoomBadge />

        <TabNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

        <div className="backdrop-blur-2xl bg-panel/70 border border-slate-700/50 rounded-[2rem] p-5 sm:p-6 md:p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] relative overflow-hidden min-h-[500px]">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-fuchsia-400/20 to-transparent" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            {activeTab === 'input' && <InputSection onNavigateToPlayers={() => setActiveTab('players')} />}
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
        </div>

        <footer className="text-center py-8 text-[10px] text-slate-700 font-mono tracking-[0.2em] uppercase">
          ROAD to RICH — Provided by K.Waga
        </footer>
      </div>
    </div>
  );
}

export default App;
