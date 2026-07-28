import { useState } from 'react';
import { BarChart3, Crown, History, Plus, Settings as SettingsIcon, Users } from 'lucide-react';
import { Background } from './components/layout/Background';
import { Header } from './components/layout/Header';
import { TabNav, type TabDef } from './components/layout/TabNav';
import { InputSection } from './components/input/InputSection';
import { DashboardSection } from './components/dashboard/DashboardSection';
import { HistorySection } from './components/history/HistorySection';
import { RankingSection } from './components/ranking/RankingSection';
import { SettingsSection } from './components/settings/SettingsSection';
import { PlayerSection } from './components/players/PlayerSection';
import { RoomGate } from './components/room/RoomGate';
import { RoomBadge } from './components/room/RoomBadge';

const TABS: TabDef[] = [
  { id: 'input', name: '成績入力・精算', icon: Plus },
  { id: 'dashboard', name: 'ダッシュボード', icon: BarChart3 },
  { id: 'history', name: '対戦履歴', icon: History },
  { id: 'ranking', name: 'ランキング', icon: Crown },
  { id: 'settings', name: '計算設定', icon: SettingsIcon },
  { id: 'players', name: '雀士登録', icon: Users },
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
            {activeTab === 'dashboard' && <DashboardSection />}
            {activeTab === 'history' && <HistorySection />}
            {activeTab === 'ranking' && <RankingSection />}
            {activeTab === 'settings' && <SettingsSection />}
            {activeTab === 'players' && <PlayerSection />}
          </div>
        </div>

        <footer className="text-center py-8 text-[10px] text-slate-700 font-mono tracking-[0.2em] uppercase">
          ROAD to RICH — Mahjong Settlement System
        </footer>
      </div>
    </div>
  );
}

export default App;
