import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Settings, History, Trophy, Plus, Save, 
  Trash2, ChevronDown, Check, Edit2, AlertCircle, 
  Gamepad2, Crown, TrendingUp, DollarSign, Activity,
  BarChart3, Zap, Target, Award
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [players, setPlayers] = useState([
    { id: 1, name: 'Player 1' },
    { id: 2, name: 'Player 2' },
    { id: 3, name: 'Player 3' },
    { id: 4, name: 'Player 4' }
  ]);
  const [settings, setSettings] = useState({
    playerCount: 4,
    initialScore: 25000,
    rankPoints: [30000, 10000, -10000, -30000],
    divider: 10,
    chipValue: 100
  });

  const [currentDayGames, setCurrentDayGames] = useState([]);
  const [history, setHistory] = useState([]);

  // Load from local storage
  useEffect(() => {
    const loadedPlayers = localStorage.getItem('mahjongPlayers');
    const loadedSettings = localStorage.getItem('mahjongSettings');
    const loadedHistory = localStorage.getItem('mahjongHistory');
    const loadedCurrentDay = localStorage.getItem('mahjongCurrentDay');
    
    if (loadedPlayers) setPlayers(JSON.parse(loadedPlayers));
    if (loadedSettings) setSettings(JSON.parse(loadedSettings));
    if (loadedHistory) setHistory(JSON.parse(loadedHistory));
    if (loadedCurrentDay) setCurrentDayGames(JSON.parse(loadedCurrentDay));
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('mahjongPlayers', JSON.stringify(players));
    localStorage.setItem('mahjongSettings', JSON.stringify(settings));
    localStorage.setItem('mahjongHistory', JSON.stringify(history));
    localStorage.setItem('mahjongCurrentDay', JSON.stringify(currentDayGames));
  }, [players, settings, history, currentDayGames]);

  const tabs = [
    { id: 0, name: '成績入力・清算', icon: Plus },
    { id: 1, name: 'ダッシュボード', icon: BarChart3 },
    { id: 2, name: '対戦履歴', icon: History },
    { id: 3, name: 'ランキング', icon: Trophy },
    { id: 4, name: '計算設定', icon: Settings },
    { id: 5, name: '雀士登録', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative">
      {/* Ultra Premium Cyber Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d415_1px,transparent_1px),linear-gradient(to_bottom,#06b6d415_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-cyan-900/20 via-blue-900/5 to-transparent"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-600/10 blur-[120px] rounded-full mix-blend-screen"></div>
      </div>

      <div className="max-w-md md:max-w-5xl mx-auto p-4 md:p-6 relative z-10">
        <header className="mb-10 text-center pt-8 pb-4 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-24 bg-cyan-500/10 blur-[50px] rounded-full"></div>
          <h1 className="text-4xl md:text-6xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-500 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)] uppercase mb-3 relative z-10">
            ROAD to RICH
          </h1>
          <div className="flex items-center justify-center gap-3 relative z-10">
            <span className="w-12 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-cyan-500"></span>
            <p className="text-cyan-300 text-[10px] md:text-xs tracking-[0.1em] md:tracking-[0.2em] font-mono font-bold drop-shadow-[0_0_5px_rgba(6,182,212,0.8)] uppercase">Mahjong Financial Transaction System</p>
            <span className="w-12 h-[2px] bg-gradient-to-l from-transparent via-cyan-400 to-cyan-500"></span>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto space-x-3 mb-8 pb-4 scrollbar-hide snap-x relative">
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`snap-center flex items-center whitespace-nowrap px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-500 relative overflow-hidden group ${
                  isActive
                    ? 'text-cyan-50 bg-[#0a192f]/80 border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 bg-slate-900/40 border border-slate-800/80 hover:bg-slate-800/80 hover:text-cyan-200 hover:border-cyan-800/80'
                }`}
              >
                {isActive && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 mix-blend-overlay"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)]"></div>
                  </>
                )}
                <Icon className={`w-4 h-4 mr-2.5 relative z-10 transition-all duration-300 ${isActive ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,1)] scale-110' : 'group-hover:text-cyan-400/80 group-hover:scale-110'}`} />
                <span className="relative z-10 tracking-wider">{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Glassmorphism Content Area */}
        <div className="backdrop-blur-2xl bg-[#0b1120]/70 border border-slate-700/50 rounded-[2rem] p-6 md:p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] relative overflow-hidden min-h-[500px]">
          {/* Edge Highlights */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-fuchsia-400/20 to-transparent"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10">
            {activeTab === 0 && <InputSection players={players} settings={settings} currentDayGames={currentDayGames} setCurrentDayGames={setCurrentDayGames} history={history} setHistory={setHistory} />}
            {activeTab === 1 && <DashboardSection history={history} players={players} />}
            {activeTab === 2 && <HistorySection history={history} players={players} />}
            {activeTab === 3 && <RankingSection history={history} players={players} />}
            {activeTab === 4 && <SettingsSection settings={settings} setSettings={setSettings} />}
            {activeTab === 5 && <PlayerSection players={players} setPlayers={setPlayers} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function InputSection({ players, settings, currentDayGames, setCurrentDayGames, history, setHistory }) {
  const [isSettling, setIsSettling] = useState(false);
  const [selectedIds, setSelectedIds] = useState(Array(settings.playerCount).fill(''));
  const [scores, setScores] = useState(Array(settings.playerCount).fill(''));
  const [chips, setChips] = useState({});
  const [tableFee, setTableFee] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setSelectedIds(Array(settings.playerCount).fill(''));
    setScores(Array(settings.playerCount).fill(''));
  }, [settings.playerCount]);

  const currentProfits = useMemo(() => {
    const profits = {};
    currentDayGames.forEach(g => {
      g.scores.forEach(s => {
        if (!profits[s.playerId]) profits[s.playerId] = 0;
        profits[s.playerId] += s.point;
      });
    });
    return profits;
  }, [currentDayGames]);

  const handleScoreChange = (index, value) => {
    const newScores = [...scores];
    newScores[index] = value;
    
    const lastIndex = settings.playerCount - 1;
    if (index !== lastIndex) {
      let sum = 0;
      let filledCount = 0;
      for (let i = 0; i < lastIndex; i++) {
        if (newScores[i] !== '') {
          sum += Number(newScores[i]);
          filledCount++;
        }
      }
      
      if (filledCount === lastIndex) {
        const total = (settings.initialScore / 100) * settings.playerCount;
        newScores[lastIndex] = String(total - sum);
      }
    }
    
    setScores(newScores);
  };

  const recordGame = () => {
    setErrorMsg('');
    
    if (selectedIds.some(id => id === '')) {
      setErrorMsg('全員の雀士を選択してください。');
      return;
    }
    
    const uniqueIds = new Set(selectedIds);
    if (uniqueIds.size !== settings.playerCount) {
      setErrorMsg('雀士が重複しています。');
      return;
    }
    
    if (scores.some(s => s === '')) {
      setErrorMsg('全員の素点を入力してください。');
      return;
    }

    const totalExpected = (settings.initialScore / 100) * settings.playerCount;
    const currentTotal = scores.reduce((sum, s) => sum + Number(s), 0);
    
    if (currentTotal !== totalExpected) {
      setErrorMsg(`素点の合計が合いません。合計は ${totalExpected}00 点になる必要があります。`);
      return;
    }

    const rawScoresNum = scores.map(s => Number(s) * 100);
    const scoreObjs = selectedIds.map((id, i) => ({ id: Number(id), score: rawScoresNum[i] }));
    
    scoreObjs.sort((a, b) => b.score - a.score);
    
    scoreObjs.forEach((obj, idx) => {
      obj.rank = idx + 1;
      obj.point = (obj.score + settings.rankPoints[idx] - settings.initialScore) / settings.divider;
    });

    const gameScores = selectedIds.map((id, i) => {
      const so = scoreObjs.find(o => o.id === Number(id));
      return {
        playerId: Number(id),
        rawScore: rawScoresNum[i],
        rank: so.rank,
        point: so.point
      };
    });

    const newGame = {
      id: Date.now(),
      scores: gameScores
    };

    setCurrentDayGames([...currentDayGames, newGame]);
    setScores(Array(settings.playerCount).fill(''));
  };

  const startSettling = () => {
    if (currentDayGames.length === 0) {
      setErrorMsg('ゲームが1つも記録されていません。');
      return;
    }
    setIsSettling(true);
    setErrorMsg('');
    
    const participants = new Set();
    currentDayGames.forEach(g => g.scores.forEach(s => participants.add(s.playerId)));
    
    const initialChips = {};
    participants.forEach(pid => initialChips[pid] = 0);
    setChips(initialChips);
  };

  const saveDay = () => {
    const totalChips = Object.values(chips).reduce((sum, c) => sum + Number(c), 0);
    if (totalChips !== 0) {
      setErrorMsg('チップの合計が0になっていません。プラスマイナスゼロにしてください。');
      return;
    }

    const participants = Object.keys(chips);
    const feePerPerson = Number(tableFee) ? Math.ceil(Number(tableFee) / participants.length) : 0;
    
    const settlement = {};
    participants.forEach(pidStr => {
      const pid = Number(pidStr);
      let totalPoint = 0;
      currentDayGames.forEach(g => {
        const s = g.scores.find(x => x.playerId === pid);
        if (s) totalPoint += s.point;
      });
      
      const chipValue = (Number(chips[pidStr]) || 0) * settings.chipValue;
      
      settlement[pid] = {
        rawPoints: totalPoint,
        chipValue: chipValue,
        tableFee: feePerPerson
      };
    });

    const newDay = {
      id: Date.now(),
      date: new Date().toISOString(),
      games: currentDayGames,
      tableFee: Number(tableFee) || 0,
      chips: chips,
      settlement
    };

    setHistory([...history, newDay]);
    setCurrentDayGames([]);
    setIsSettling(false);
    setSelectedIds(Array(settings.playerCount).fill(''));
    setTableFee('');
    setChips({});
  };

  const getPlayerName = (id) => players.find(p => p.id === id)?.name || 'Unknown';
  const participantsList = Object.keys(chips).map(Number);

  if (isSettling) {
    return (
      <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-5 relative">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 to-cyan-400 flex items-center tracking-wider">
            <DollarSign className="w-8 h-8 mr-3 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            本日の精算
          </h2>
          <div className="absolute -bottom-[1px] left-0 w-32 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent"></div>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/40 border border-rose-500/50 p-5 rounded-2xl flex items-start gap-4 mb-6 shadow-[0_0_20px_rgba(244,63,94,0.15)] backdrop-blur-md">
            <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            <div className="text-rose-200 text-sm font-bold tracking-wide mt-0.5">{errorMsg}</div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-[#0f172a]/80 p-6 rounded-3xl border border-slate-700/50 shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <label className="block text-xs font-black text-cyan-400 mb-4 tracking-[0.2em] uppercase flex items-center">
                <span className="w-2 h-2 rounded-full bg-cyan-400 mr-2 animate-pulse"></span>
                1日の総場代 (円)
              </label>
              <input
                type="number"
                value={tableFee}
                onChange={(e) => setTableFee(e.target.value)}
                className="w-full bg-[#030712] border border-slate-700 rounded-2xl px-5 py-4 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 font-mono text-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] transition-all"
                placeholder="0"
              />
            </div>

            <div className="bg-[#0f172a]/80 p-6 rounded-3xl border border-slate-700/50 shadow-inner relative overflow-hidden">
               <label className="block text-xs font-black text-cyan-400 mb-4 tracking-[0.2em] uppercase flex items-center">
                 <span className="w-2 h-2 rounded-full bg-fuchsia-400 mr-2 animate-pulse"></span>
                 チップ精算 (±枚数)
               </label>
               <div className="space-y-3">
                  {participantsList.map(pid => (
                    <div key={pid} className="flex items-center justify-between bg-[#030712]/80 p-3.5 rounded-2xl border border-slate-800/80 hover:border-slate-600 transition-colors">
                      <span className="font-bold text-slate-200 tracking-wide pl-2">{getPlayerName(pid)}</span>
                      <div className="relative">
                        <input
                          type="number"
                          value={chips[pid] === 0 ? '' : chips[pid]}
                          onChange={(e) => setChips({...chips, [pid]: e.target.value})}
                          className="w-28 bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/50 font-mono text-right text-lg transition-all"
                          placeholder="0"
                        />
                        <span className="absolute right-[-24px] top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">枚</span>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0f172a] to-[#070b14] p-6 md:p-8 rounded-3xl border border-slate-700/50 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[40px] rounded-full pointer-events-none"></div>
             <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 mb-6 tracking-[0.2em] uppercase flex items-center">
               <Activity className="w-5 h-5 mr-2 text-cyan-400" />
               最終精算結果プレビュー
             </h3>
             <div className="space-y-4">
               {participantsList.map(pid => {
                 let totalPoint = 0;
                 currentDayGames.forEach(g => {
                   const s = g.scores.find(x => x.playerId === pid);
                   if (s) totalPoint += s.point;
                 });
                 const chipValue = (Number(chips[pid]) || 0) * settings.chipValue;
                 const fee = Number(tableFee) ? Math.ceil(Number(tableFee) / participantsList.length) : 0;
                 
                 const subTotal = totalPoint + chipValue;
                 const finalTotal = subTotal - fee;
                 
                 return (
                   <div key={pid} className="bg-[#030712]/90 p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden group hover:border-cyan-900/50 transition-colors">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-blue-600 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-end">
                          <span className="font-black text-slate-100 text-xl tracking-wider pl-2">{getPlayerName(pid)}</span>
                          <span className={`text-2xl font-mono font-black ${finalTotal >= 0 ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]' : 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]'}`}>
                            {finalTotal >= 0 ? '+' : ''}{finalTotal}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono font-bold bg-[#0a0f1d] p-3 rounded-xl border border-slate-800">
                           <span className="text-slate-400 flex items-center gap-1">素点+ｳﾏ: <span className={totalPoint >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{totalPoint >= 0 ? '+' : ''}{totalPoint}</span></span>
                           <span className="text-slate-400 flex items-center gap-1">チップ: <span className={chipValue >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{chipValue >= 0 ? '+' : ''}{chipValue}</span></span>
                           <span className="text-slate-400 flex items-center gap-1">場代: <span className="text-rose-400">-{fee}</span></span>
                        </div>
                      </div>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button onClick={() => setIsSettling(false)} className="px-8 py-4 rounded-2xl font-bold border-2 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:text-white transition-all sm:w-1/3 text-lg tracking-wider">
            戻る
          </button>
          <button onClick={saveDay} className="flex-1 relative group overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0)_0%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0)_100%)] -skew-x-12 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
            <div className="relative flex items-center justify-center py-5 font-black text-xl text-white drop-shadow-md tracking-widest">
              <Save className="w-6 h-6 mr-3 animate-bounce" /> 結果を保存する
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-end border-b border-slate-700/50 pb-5 relative">
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 to-cyan-400 flex items-center tracking-wider">
          <Gamepad2 className="w-8 h-8 mr-3 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          半荘成績入力
        </h2>
        <div className="text-cyan-400 font-mono font-black bg-cyan-950/40 px-4 py-1.5 rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)] tracking-widest text-sm">
          {settings.playerCount}人麻雀
        </div>
        <div className="absolute -bottom-[1px] left-0 w-32 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent"></div>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/40 border border-rose-500/50 p-5 rounded-2xl flex items-start gap-4 shadow-[0_0_20px_rgba(244,63,94,0.15)] backdrop-blur-md">
          <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
          <div className="text-rose-200 text-sm font-bold tracking-wide mt-0.5">{errorMsg}</div>
        </div>
      )}

      {currentDayGames.length > 0 && (
        <div className="bg-[#0f172a]/60 p-6 rounded-3xl border border-cyan-900/40 shadow-[0_0_20px_rgba(6,182,212,0.1)] backdrop-blur-sm">
          <h3 className="text-xs font-black text-cyan-400 mb-4 tracking-[0.2em] uppercase flex items-center">
             <Activity className="w-4 h-4 mr-2 animate-pulse" /> 現在の暫定損益 ({currentDayGames.length}G)
          </h3>
          <div className="flex flex-wrap gap-4">
             {Object.entries(currentProfits).map(([pid, profit]) => (
               <div key={pid} className="bg-[#030712]/80 px-4 py-2.5 rounded-xl border border-slate-700/60 flex items-center gap-3 shadow-inner">
                 <span className="text-sm font-bold text-slate-300 tracking-wide">{getPlayerName(Number(pid))}</span>
                 <span className={`text-base font-mono font-black ${profit >= 0 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}>
                   {profit > 0 ? '+' : ''}{profit}
                 </span>
               </div>
             ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {[...Array(settings.playerCount)].map((_, i) => {
          const isAutoCalculated = i === settings.playerCount - 1;
          return (
            <div key={i} className={`flex flex-col md:flex-row md:items-center gap-4 p-5 rounded-2xl border transition-all duration-300 ${isAutoCalculated ? 'bg-cyan-950/20 border-cyan-800/50 shadow-[0_0_15px_rgba(6,182,212,0.05)]' : 'bg-[#0f172a]/60 border-slate-700/50 hover:border-slate-500/50'}`}>
              <div className="relative flex-1">
                 <select
                   value={selectedIds[i]}
                   onChange={(e) => {
                     const newIds = [...selectedIds];
                     newIds[i] = e.target.value;
                     setSelectedIds(newIds);
                   }}
                   className="w-full bg-[#030712] border border-slate-700/80 rounded-xl px-4 py-3.5 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 font-bold appearance-none transition-all cursor-pointer tracking-wider shadow-inner"
                 >
                   <option value="" className="text-slate-500">SELECT PLAYER</option>
                   {players.map(p => {
                     const isSelectedElsewhere = selectedIds.includes(String(p.id)) && selectedIds[i] !== String(p.id);
                     if (isSelectedElsewhere) return null;
                     return (
                       <option key={p.id} value={p.id}>
                         {p.name}
                       </option>
                     );
                   })}
                 </select>
                 <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-500/70 pointer-events-none" />
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                 <div className="relative flex-1 md:w-48">
                   <input
                     type="number"
                     value={scores[i]}
                     onChange={(e) => handleScoreChange(i, e.target.value)}
                     disabled={isAutoCalculated}
                     className={`w-full bg-[#030712] border ${isAutoCalculated ? 'border-cyan-800/80 text-cyan-300 bg-cyan-950/30' : 'border-slate-700/80 text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50'} rounded-xl px-4 py-3.5 focus:outline-none font-mono text-2xl text-right transition-all shadow-inner`}
                     placeholder="0"
                   />
                 </div>
                 <span className={`font-mono font-black text-2xl w-12 ${isAutoCalculated ? 'text-cyan-500/80 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]' : 'text-slate-500'}`}>00</span>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={recordGame} className="w-full relative group overflow-hidden rounded-2xl mt-6">
        <div className="absolute inset-0 bg-[#0a192f] border-2 border-cyan-700/50 group-hover:border-cyan-400 transition-colors duration-300 rounded-2xl"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        <div className="relative flex items-center justify-center py-5 font-black text-lg text-cyan-300 group-hover:text-cyan-100 tracking-widest drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
          <Plus className="w-6 h-6 mr-2" /> この半荘を記録する
        </div>
      </button>

      {currentDayGames.length > 0 && (
        <div className="pt-8 mt-8 border-t border-slate-700/50">
          <button onClick={startSettling} className="w-full relative group overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-600 opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-30"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0)_0%,rgba(255,255,255,0.3)_50%,rgba(255,255,255,0)_100%)] -skew-x-12 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
            <div className="relative flex items-center justify-center py-6 font-black text-xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] tracking-[0.15em]">
              <Target className="w-6 h-6 mr-3" /> 一日の対局を終えて清算する
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

function DashboardSection({ history, players }) {
  const stats = useMemo(() => {
    let totalGames = 0;
    let highestScore = 0;
    let highestScorePlayer = '-';
    let maxDailyWin = 0;
    let maxDailyWinPlayer = '-';

    history.forEach(day => {
      totalGames += day.games.length;
      
      day.games.forEach(g => {
        g.scores.forEach(s => {
          if (s.rawScore > highestScore) {
            highestScore = s.rawScore;
            highestScorePlayer = players.find(p => p.id === s.playerId)?.name || 'Unknown';
          }
        });
      });

      Object.keys(day.settlement).forEach(pid => {
        const res = day.settlement[pid];
        const final = res.rawPoints + res.chipValue - res.tableFee;
        if (final > maxDailyWin) {
          maxDailyWin = final;
          maxDailyWinPlayer = players.find(p => p.id === Number(pid))?.name || 'Unknown';
        }
      });
    });

    return {
      totalDays: history.length,
      totalGames,
      highestScore,
      highestScorePlayer,
      maxDailyWin,
      maxDailyWinPlayer
    };
  }, [history, players]);

  const { chartData, activePlayers, minY, maxY } = useMemo(() => {
    const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const playedIds = new Set();
    history.forEach(day => Object.keys(day.settlement).forEach(id => playedIds.add(Number(id))));
    const activePs = players.filter(p => playedIds.has(p.id));

    const playerTotals = {};
    activePs.forEach(p => playerTotals[p.id] = 0);

    const dataPoints = sortedHistory.map((day, idx) => {
      const point = { 
        label: idx === 0 || idx === sortedHistory.length - 1 ? 
               new Date(day.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }) 
               : `Day ${idx + 1}`
      };
      Object.keys(day.settlement).forEach(pid => {
        const res = day.settlement[pid];
        const final = res.rawPoints + res.chipValue - res.tableFee;
        if (playerTotals[pid] !== undefined) {
          playerTotals[pid] += final;
        }
      });
      activePs.forEach(p => {
        point[p.id] = playerTotals[p.id] || 0;
      });
      return point;
    });

    const initialPoint = { label: 'Start' };
    activePs.forEach(p => initialPoint[p.id] = 0);
    const finalData = [initialPoint, ...dataPoints];

    let min = 0;
    let max = 0;
    finalData.forEach(pt => {
      activePs.forEach(p => {
        if (pt[p.id] > max) max = pt[p.id];
        if (pt[p.id] < min) min = pt[p.id];
      });
    });

    const range = (max - min) || 10000;
    max += range * 0.15;
    min -= range * 0.15;

    return { chartData: finalData, activePlayers: activePs, minY: min, maxY: max };
  }, [history, players]);

  const colors = ['#06b6d4', '#e879f9', '#34d399', '#fbbf24', '#f87171', '#818cf8', '#a3e635'];

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-500 opacity-60">
        <BarChart3 className="w-16 h-16 mb-4" />
        <p className="font-bold tracking-[0.2em] uppercase">No Data Available</p>
      </div>
    );
  }

  const svgWidth = 800;
  const svgHeight = 400;
  const paddingX = 60;
  const paddingY = 40;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;
  const boundedRange = maxY - minY;

  const getX = (index) => paddingX + (index / Math.max(1, chartData.length - 1)) * chartWidth;
  const getY = (val) => svgHeight - paddingY - ((val - minY) / boundedRange) * chartHeight;
  const yZero = getY(0);

  const StatCard = ({ title, value, sub, icon, color }) => {
    const colorMap = {
      cyan: 'text-cyan-400 bg-[#0a192f]/60 border-cyan-800/60 shadow-[0_4px_20px_rgba(6,182,212,0.15)]',
      fuchsia: 'text-fuchsia-400 bg-fuchsia-950/20 border-fuchsia-800/60 shadow-[0_4px_20px_rgba(232,121,249,0.15)]',
      yellow: 'text-yellow-400 bg-yellow-950/20 border-yellow-800/60 shadow-[0_4px_20px_rgba(250,204,21,0.15)]',
      emerald: 'text-emerald-400 bg-emerald-950/20 border-emerald-800/60 shadow-[0_4px_20px_rgba(52,211,153,0.15)]',
    };
    const textMap = {
      cyan: 'text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]',
      fuchsia: 'text-fuchsia-300 drop-shadow-[0_0_10px_rgba(232,121,249,0.8)]',
      yellow: 'text-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]',
      emerald: 'text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]',
    };

    return (
      <div className={`p-5 rounded-3xl border flex flex-col justify-between relative overflow-hidden group transition-all duration-500 hover:scale-[1.02] ${colorMap[color]} backdrop-blur-sm`}>
        <div className="absolute top-0 right-0 -mt-2 -mr-2 opacity-10 group-hover:opacity-20 transition-opacity duration-500 group-hover:scale-125 transform">
          {React.cloneElement(icon, { className: 'w-20 h-20' })}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="text-xs font-black text-slate-400 mb-2 tracking-[0.15em] z-10 uppercase">{title}</div>
        <div className={`text-xl sm:text-2xl md:text-3xl font-black font-mono z-10 ${textMap[color]}`}>
          {value}
        </div>
        {sub && (
          <div className="text-[10px] md:text-xs text-slate-400 font-bold mt-2 z-10 uppercase tracking-widest truncate flex items-center">
            <span className="w-1 h-1 rounded-full bg-current mr-1.5 opacity-50"></span>
            BY {sub}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-5 relative">
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 to-cyan-400 flex items-center tracking-wider">
          <BarChart3 className="w-8 h-8 mr-3 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          ダッシュボード
        </h2>
        <div className="absolute -bottom-[1px] left-0 w-32 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent"></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="総稼働日数" value={`${stats.totalDays} DAYS`} icon={<Zap />} color="cyan" />
        <StatCard title="総半荘数" value={`${stats.totalGames} GAMES`} icon={<Gamepad2 />} color="fuchsia" />
        <StatCard title="最高素点" value={stats.highestScore.toLocaleString()} sub={stats.highestScorePlayer} icon={<Award />} color="yellow" />
        <StatCard title="1日最高勝利" value={`+${stats.maxDailyWin.toLocaleString()}`} sub={stats.maxDailyWinPlayer} icon={<Crown />} color="emerald" />
      </div>

      <div className="bg-[#0f172a]/80 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden group hover:border-cyan-800/80 transition-colors duration-500 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <h3 className="text-sm font-black text-cyan-400 mb-8 flex items-center tracking-[0.2em] uppercase">
          <TrendingUp className="w-5 h-5 mr-2" /> 累計収支推移 <span className="text-slate-500 ml-2 font-normal text-xs">(Cumulative Profit)</span>
        </h3>
        
        <div className="overflow-x-auto overflow-y-hidden pb-4 scrollbar-hide">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full min-w-[600px] h-auto drop-shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            
            {chartData.map((_, i) => (
              <line key={`v-${i}`} x1={getX(i)} y1={paddingY} x2={getX(i)} y2={svgHeight - paddingY} stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" opacity="0.8" />
            ))}
            {[...Array(5)].map((_, i) => {
              const y = paddingY + (i / 4) * chartHeight;
              return <line key={`h-${i}`} x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke="#1e293b" strokeWidth="1" opacity="0.8" />;
            })}

            <line x1={paddingX} y1={yZero} x2={svgWidth - paddingX} y2={yZero} stroke="#475569" strokeWidth="2" strokeDasharray="6,6" opacity="0.8" />
            <text x={paddingX - 12} y={yZero + 4} fill="#94a3b8" fontSize="11" textAnchor="end" className="font-mono font-bold tracking-wider">±0</text>

            <text x={paddingX - 12} y={paddingY + 4} fill="#94a3b8" fontSize="11" textAnchor="end" className="font-mono tracking-wider">{Math.round(maxY).toLocaleString()}</text>
            <text x={paddingX - 12} y={svgHeight - paddingY + 4} fill="#94a3b8" fontSize="11" textAnchor="end" className="font-mono tracking-wider">{Math.round(minY).toLocaleString()}</text>

            {chartData.map((pt, i) => {
              if (i === 0 || i === chartData.length - 1 || i % Math.ceil(chartData.length / 5) === 0) {
                return (
                  <text key={`xl-${i}`} x={getX(i)} y={svgHeight - paddingY + 24} fill="#64748b" fontSize="11" textAnchor="middle" className="font-mono font-bold tracking-wider">
                    {pt.label}
                  </text>
                );
              }
              return null;
            })}

            {activePlayers.map((p, pIdx) => {
              const color = colors[pIdx % colors.length];
              const pointsStr = chartData.map((pt, i) => `${getX(i)},${getY(pt[p.id])}`).join(' ');
              
              return (
                <g key={p.id}>
                  <polyline 
                    points={pointsStr} 
                    fill="none" 
                    stroke={color} 
                    strokeWidth="3.5" 
                    filter="url(#glow)"
                    className="transition-all duration-1000 ease-in-out drop-shadow-md"
                  />
                  {chartData.map((pt, i) => (
                    <circle 
                      key={`c-${p.id}-${i}`} 
                      cx={getX(i)} 
                      cy={getY(pt[p.id])} 
                      r="4" 
                      fill="#030712" 
                      stroke={color} 
                      strokeWidth="2.5" 
                      className="hover:r-6 transition-all duration-300 cursor-pointer"
                    >
                      <title>{`${p.name}: ${Math.round(pt[p.id]).toLocaleString()}`}</title>
                    </circle>
                  ))}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mt-8 pt-6 border-t border-slate-700/50">
          {activePlayers.map((p, pIdx) => (
            <div key={p.id} className="flex items-center text-xs font-bold font-mono tracking-wider bg-[#030712]/50 px-4 py-2 rounded-full border border-slate-800">
              <span className="w-3 h-3 rounded-full mr-2.5" style={{ backgroundColor: colors[pIdx % colors.length], boxShadow: `0 0 10px ${colors[pIdx % colors.length]}` }}></span>
              <span className="text-slate-200">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HistorySection({ history, players }) {
  const [expandedId, setExpandedId] = useState(null);

  const getPlayerName = (id) => players.find(p => p.id === id)?.name || 'Unknown';

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-500 opacity-60">
        <History className="w-16 h-16 mb-4" />
        <p className="font-bold tracking-[0.2em] uppercase">No Data Available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-5 relative">
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 to-cyan-400 flex items-center tracking-wider">
          <History className="w-8 h-8 mr-3 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          対戦履歴
        </h2>
        <div className="absolute -bottom-[1px] left-0 w-32 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent"></div>
      </div>
      
      <div className="space-y-5">
        {history.slice().reverse().map(day => {
          const dateStr = new Date(day.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
          const isExpanded = expandedId === day.id;

          return (
            <div key={day.id} className={`bg-[#0f172a]/60 border transition-all duration-300 rounded-[2rem] overflow-hidden backdrop-blur-sm ${isExpanded ? 'border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.15)]' : 'border-slate-700/50 hover:border-slate-500/50'}`}>
              <div 
                className="p-6 bg-[#030712]/40 flex justify-between items-center cursor-pointer group relative overflow-hidden" 
                onClick={() => setExpandedId(isExpanded ? null : day.id)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="font-mono text-cyan-300 font-black text-xl tracking-widest drop-shadow-md">{dateStr}</div>
                  <div className="text-xs text-slate-400 mt-2 flex items-center gap-4 font-bold tracking-wider">
                    <span className="bg-[#0a192f] border border-cyan-900/50 px-3 py-1 rounded-md text-cyan-400">{day.games.length} GAMES</span>
                    <span className="flex items-center"><DollarSign className="w-3 h-3 mr-0.5"/>FEE: {day.tableFee}</span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 relative z-10 ${isExpanded ? 'bg-cyan-900/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-[#0f172a] text-slate-400 group-hover:bg-[#1e293b] group-hover:text-cyan-400'}`}>
                  <ChevronDown className={`w-6 h-6 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {isExpanded && (
                <div className="p-6 md:p-8 border-t border-slate-700/50 bg-[#0a0f1d]/80 relative">
                  <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#030712]/50 to-transparent"></div>
                  
                  <h4 className="text-xs font-black text-cyan-400 mb-4 tracking-[0.2em] uppercase flex items-center relative z-10">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 mr-2 shadow-[0_0_8px_rgba(34,211,238,1)]"></span>
                    Daily Settlement
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 relative z-10">
                    {Object.keys(day.settlement).map(pid => {
                      const res = day.settlement[pid];
                      const final = res.rawPoints + res.chipValue - res.tableFee;
                      return (
                        <div key={pid} className="bg-[#030712] p-4 rounded-2xl border border-slate-700/80 flex flex-col justify-center relative overflow-hidden group hover:border-cyan-800/80 transition-colors">
                          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="text-xs font-bold text-slate-400 mb-2 tracking-wide pl-1">{getPlayerName(Number(pid))}</div>
                          <div className={`font-mono font-black text-xl md:text-2xl pl-1 ${final >= 0 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-rose-400'}`}>
                            {final > 0 ? '+' : ''}{Math.round(final).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <h4 className="text-xs font-black text-blue-400 mb-4 tracking-[0.2em] uppercase flex items-center relative z-10">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 shadow-[0_0_8px_rgba(59,130,246,1)]"></span>
                    Matrix Details
                  </h4>
                  <div className="overflow-x-auto rounded-2xl border border-slate-700/50 shadow-inner relative z-10">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-400 bg-[#030712] uppercase tracking-widest">
                        <tr>
                          <th className="px-5 py-4 border-r border-slate-700/50 font-black">GAME</th>
                          {Object.keys(day.settlement).map(pid => (
                            <th key={pid} className="px-5 py-4 text-center font-black">{getPlayerName(Number(pid))}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="font-mono">
                        {day.games.map((g, idx) => (
                          <tr key={g.id} className="border-b border-slate-700/50 bg-[#0f172a]/40 hover:bg-[#1e293b]/60 transition-colors">
                            <td className="px-5 py-4 border-r border-slate-700/50 text-cyan-500 font-black">#{String(idx + 1).padStart(2, '0')}</td>
                            {Object.keys(day.settlement).map(pid => {
                              const scoreData = g.scores.find(s => s.playerId === Number(pid));
                              return (
                                <td key={pid} className="px-5 py-4 text-center">
                                  {scoreData ? (
                                    <div className="flex flex-col items-center">
                                      <span className="text-slate-200 font-bold text-base">{scoreData.rawScore}</span>
                                      <span className={`text-[10px] mt-1 font-bold px-2 py-0.5 rounded-full ${scoreData.point >= 0 ? 'bg-emerald-950/50 text-emerald-400' : 'bg-rose-950/50 text-rose-400'}`}>
                                        {scoreData.rank}着
                                      </span>
                                    </div>
                                  ) : <span className="text-slate-600 font-bold">-</span>}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RankingSection({ history, players }) {
  const stats = useMemo(() => {
    const data = {};
    players.forEach(p => {
      data[p.id] = { id: p.id, name: p.name, playCount: 0, totalProfit: 0, rankSum: 0, chipSum: 0 };
    });

    history.forEach(day => {
      Object.keys(day.settlement).forEach(pid => {
        const id = Number(pid);
        if (data[id]) {
          data[id].totalProfit += (day.settlement[pid].rawPoints + day.settlement[pid].chipValue - day.settlement[pid].tableFee);
          if (day.chips[pid]) {
             data[id].chipSum += Number(day.chips[pid]);
          }
        }
      });
      day.games.forEach(g => {
        g.scores.forEach(s => {
          if (data[s.playerId]) {
            data[s.playerId].playCount += 1;
            data[s.playerId].rankSum += s.rank;
          }
        });
      });
    });

    return Object.values(data)
      .filter(p => p.playCount > 0)
      .sort((a, b) => b.totalProfit - a.totalProfit);
  }, [history, players]);

  if (stats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-500 opacity-60">
        <Trophy className="w-16 h-16 mb-4" />
        <p className="font-bold tracking-[0.2em] uppercase">No Ranking Data</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-5 relative">
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-500 flex items-center tracking-wider drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
          <Crown className="w-8 h-8 mr-3 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
          総合ランキング
        </h2>
        <div className="absolute -bottom-[1px] left-0 w-32 h-[2px] bg-gradient-to-r from-yellow-500 to-transparent"></div>
      </div>

      <div className="space-y-5">
        {stats.map((s, idx) => {
          const avgRank = s.playCount > 0 ? (s.rankSum / s.playCount).toFixed(2) : '-';
          const avgProfit = s.playCount > 0 ? Math.round(s.totalProfit / s.playCount) : 0;
          const avgChip = s.playCount > 0 ? (s.chipSum / s.playCount).toFixed(2) : 0;
          
          let rankColor = 'text-slate-600';
          let borderColor = 'border-slate-800/80';
          let glowClass = '';
          
          if (idx === 0) { 
            rankColor = 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]'; 
            borderColor = 'border-yellow-500/40 bg-yellow-950/10'; 
            glowClass = 'shadow-[0_0_30px_rgba(250,204,21,0.15)]';
          }
          else if (idx === 1) { 
            rankColor = 'text-slate-300 drop-shadow-[0_0_10px_rgba(203,213,225,0.8)]'; 
            borderColor = 'border-slate-400/40 bg-slate-900/40'; 
          }
          else if (idx === 2) { 
            rankColor = 'text-amber-600 drop-shadow-[0_0_10px_rgba(217,119,6,0.8)]'; 
            borderColor = 'border-amber-700/40 bg-amber-950/10'; 
          }

          return (
            <div key={s.id} className={`bg-[#0f172a]/70 p-5 rounded-[2rem] border ${borderColor} ${glowClass} flex flex-col md:flex-row md:items-center relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300 backdrop-blur-md`}>
              <div className={`absolute left-0 top-0 bottom-0 w-2 transition-colors ${idx === 0 ? 'bg-gradient-to-b from-yellow-400 to-amber-600' : idx === 1 ? 'bg-gradient-to-b from-slate-300 to-slate-500' : idx === 2 ? 'bg-gradient-to-b from-amber-600 to-amber-800' : 'bg-slate-800'}`}></div>
              
              <div className={`w-20 text-center font-black text-4xl italic md:mr-6 mb-4 md:mb-0 ${rankColor} font-mono tracking-tighter`}>
                #{idx + 1}
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="font-black text-2xl text-slate-100 tracking-wider">{s.name}</div>
                <div className="flex flex-wrap gap-3 md:gap-6 text-xs text-slate-400 font-mono font-bold">
                  <span className="flex items-center bg-[#030712] px-3 py-1.5 rounded-lg border border-slate-800">
                    <Gamepad2 className="w-3 h-3 mr-1.5 text-cyan-500"/>半荘: <span className="text-slate-200 ml-1.5">{s.playCount}</span>
                  </span>
                  <span className="flex items-center bg-[#030712] px-3 py-1.5 rounded-lg border border-slate-800">
                    <TrendingUp className="w-3 h-3 mr-1.5 text-fuchsia-500"/>平均着順: <span className="text-slate-200 ml-1.5">{avgRank}</span>
                  </span>
                  <span className="flex items-center bg-[#030712] px-3 py-1.5 rounded-lg border border-slate-800">
                    <Zap className="w-3 h-3 mr-1.5 text-yellow-500"/>平均チップ: 
                    <span className={`ml-1.5 ${Number(avgChip) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {Number(avgChip) > 0 ? '+' : ''}{avgChip}
                    </span>
                  </span>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 text-right md:pl-6">
                <div className="text-[10px] font-black text-slate-500 mb-1 tracking-[0.2em] uppercase">Total Profit</div>
                <div className={`font-mono text-3xl md:text-4xl font-black ${s.totalProfit >= 0 ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]' : 'text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]'}`}>
                  {s.totalProfit > 0 ? '+' : ''}{Math.round(s.totalProfit).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SettingsSection({ settings, setSettings }) {
  const handleChange = (key, val) => setSettings({ ...settings, [key]: Number(val) });
  const handleRankChange = (idx, val) => {
    const newRanks = [...settings.rankPoints];
    newRanks[idx] = Number(val);
    setSettings({ ...settings, rankPoints: newRanks });
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-5 relative">
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 to-cyan-400 flex items-center tracking-wider">
          <Settings className="w-8 h-8 mr-3 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          計算設定
        </h2>
        <div className="absolute -bottom-[1px] left-0 w-32 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0f172a]/60 p-6 rounded-[2rem] border border-slate-700/50 hover:border-cyan-800/80 transition-all duration-300 backdrop-blur-sm group">
          <label className="block text-xs font-black text-slate-400 mb-3 tracking-[0.15em] uppercase group-hover:text-cyan-400 transition-colors">対局形式</label>
          <div className="relative">
            <select 
              value={settings.playerCount} 
              onChange={e => handleChange('playerCount', e.target.value)}
              className="w-full bg-[#030712] border border-slate-700/80 rounded-xl px-5 py-4 text-slate-100 appearance-none focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 font-bold tracking-wider cursor-pointer shadow-inner transition-all"
            >
              <option value={4}>四人麻雀</option>
              <option value={3}>三人麻雀</option>
            </select>
            <ChevronDown className="absolute right-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-500/70 pointer-events-none" />
          </div>
        </div>
        
        <div className="bg-[#0f172a]/60 p-6 rounded-[2rem] border border-slate-700/50 hover:border-cyan-800/80 transition-all duration-300 backdrop-blur-sm group">
          <label className="block text-xs font-black text-slate-400 mb-3 tracking-[0.15em] uppercase group-hover:text-cyan-400 transition-colors">配給原点 (返しの点)</label>
          <input 
            type="number" 
            value={settings.initialScore} 
            onChange={e => handleChange('initialScore', e.target.value)}
            className="w-full bg-[#030712] border border-slate-700/80 rounded-xl px-5 py-4 text-cyan-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 font-mono text-lg shadow-inner transition-all"
          />
        </div>

        <div className="bg-[#0f172a]/60 p-6 rounded-[2rem] border border-slate-700/50 hover:border-cyan-800/80 transition-all duration-300 backdrop-blur-sm group">
          <label className="block text-xs font-black text-slate-400 mb-3 tracking-[0.15em] uppercase group-hover:text-cyan-400 transition-colors">チップ1枚の金額（円）</label>
          <div className="relative">
            <input 
              type="number" 
              value={settings.chipValue} 
              onChange={e => handleChange('chipValue', e.target.value)}
              className="w-full bg-[#030712] border border-slate-700/80 rounded-xl pl-5 pr-12 py-4 text-cyan-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 font-mono text-lg shadow-inner transition-all"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-500">円</span>
          </div>
        </div>
        
        <div className="bg-[#0f172a]/60 p-6 rounded-[2rem] border border-slate-700/50 hover:border-cyan-800/80 transition-all duration-300 backdrop-blur-sm group">
          <label className="block text-xs font-black text-slate-400 mb-3 tracking-[0.15em] uppercase group-hover:text-cyan-400 transition-colors">割る数 (レート相当)</label>
          <input 
            type="number" 
            value={settings.divider} 
            onChange={e => handleChange('divider', e.target.value)}
            className="w-full bg-[#030712] border border-slate-700/80 rounded-xl px-5 py-4 text-cyan-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 font-mono text-lg shadow-inner transition-all"
          />
        </div>
      </div>

      <div className="bg-[#0f172a]/60 p-6 md:p-8 rounded-[2rem] border border-slate-700/50 hover:border-cyan-800/80 transition-all duration-300 backdrop-blur-sm mt-8">
        <label className="block text-sm font-black text-cyan-400 mb-6 tracking-[0.2em] uppercase flex items-center">
          <span className="w-2 h-2 rounded-full bg-cyan-400 mr-2 shadow-[0_0_8px_rgba(34,211,238,1)]"></span>
          順位点 (ウマ・オカ込)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].slice(0, settings.playerCount).map((rank, idx) => (
            <div key={rank} className="bg-[#030712] p-4 rounded-2xl border border-slate-700/80 shadow-inner">
              <span className="text-xs font-black text-slate-500 block mb-3 tracking-[0.2em] uppercase text-center">{rank}着</span>
              <input 
                type="number" 
                value={settings.rankPoints[idx]} 
                onChange={e => handleRankChange(idx, e.target.value)}
                className="w-full bg-[#0a192f] border border-slate-700 rounded-xl px-3 py-3 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 font-mono text-lg text-center transition-all"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerSection({ players, setPlayers }) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const addPlayer = () => {
    if (newName.trim()) {
      setPlayers([...players, { id: Date.now(), name: newName.trim() }]);
      setNewName('');
    }
  };

  const deletePlayer = (id) => {
    if (players.length > 4) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const saveEdit = (id) => {
    if (editName.trim()) {
      setPlayers(players.map(p => p.id === id ? { ...p, name: editName.trim() } : p));
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-5 relative">
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 to-cyan-400 flex items-center tracking-wider">
          <Users className="w-8 h-8 mr-3 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          雀士登録
        </h2>
        <div className="absolute -bottom-[1px] left-0 w-32 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent"></div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 bg-[#0f172a]/60 p-6 rounded-[2rem] border border-slate-700/50 backdrop-blur-sm">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="NEW PLAYER NAME"
          className="flex-1 bg-[#030712] border border-slate-700/80 rounded-xl px-5 py-4 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 placeholder-slate-600 transition-all shadow-inner font-bold tracking-wide"
          onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
        />
        <button
          onClick={addPlayer}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-4 rounded-xl font-black transition-all duration-300 border border-cyan-400/30 flex items-center justify-center hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] tracking-widest sm:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" /> 追加
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {players.map(p => (
          <div key={p.id} className="bg-[#0f172a]/40 p-5 rounded-2xl border border-slate-700/50 flex justify-between items-center group hover:border-cyan-500/50 transition-all duration-300 hover:bg-[#0f172a]/80 backdrop-blur-sm">
            {editingId === p.id ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 bg-[#030712] border border-cyan-400 rounded-xl px-4 py-2.5 text-slate-100 mr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 font-bold tracking-wide"
                autoFocus
              />
            ) : (
              <span className="font-black text-slate-200 text-lg pl-2 tracking-wider group-hover:text-cyan-100 transition-colors">{p.name}</span>
            )}

            <div className="flex gap-2 transition-opacity">
              {editingId === p.id ? (
                <button onClick={() => saveEdit(p.id)} className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 border border-emerald-500/50 transition-all">
                  <Check className="w-5 h-5" />
                </button>
              ) : (
                <button onClick={() => startEdit(p)} className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 border border-blue-500/30 transition-all opacity-100 md:opacity-40 group-hover:opacity-100">
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
              {players.length > 4 && (
                <button onClick={() => deletePlayer(p.id)} className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500/20 border border-rose-500/30 transition-all opacity-100 md:opacity-40 group-hover:opacity-100">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}