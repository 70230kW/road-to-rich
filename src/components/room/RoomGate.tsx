import { type ReactNode, useEffect, useRef, useState } from 'react';
import { AlertTriangle, DoorOpen, Loader2, Radio, Shuffle } from 'lucide-react';
import { isFirebaseConfigured } from '../../lib/firebase';
import { generateRoomCode, normalizeRoomCode } from '../../lib/roomCode';
import { getSavedRoomCode, useAppStore } from '../../store/useAppStore';
import { ErrorBanner } from '../common/ErrorBanner';
import { NeonButton } from '../common/NeonButton';
import { Background } from '../layout/Background';
import { Header } from '../layout/Header';

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-abyss text-slate-200 font-sans relative overflow-x-hidden">
      <Background />
      <div className="max-w-lg mx-auto p-4 md:p-6 relative z-10 min-h-screen flex flex-col justify-center">
        <Header />
        {children}
      </div>
    </div>
  );
}

function ConfigMissingScreen() {
  return (
    <Shell>
      <div className="bg-panel-2/70 border border-amber-700/50 rounded-3xl p-6 md:p-8 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-3 text-amber-400">
          <AlertTriangle className="w-6 h-6" />
          <h2 className="font-black text-lg tracking-wide">Firebase 設定が見つかりません</h2>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          <code className="text-amber-300">.env.local</code> に Firebase の設定値（
          <code className="text-amber-300">VITE_FIREBASE_API_KEY</code> など）が設定されていません。
          <code className="text-amber-300">.env.example</code> をコピーして値を入力し、開発サーバーを再起動してください。
        </p>
      </div>
    </Shell>
  );
}

function ConnectingScreen({ roomCode }: { roomCode: string }) {
  return (
    <Shell>
      <div className="flex flex-col items-center gap-4 py-12 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
        <p className="font-mono text-sm tracking-widest">
          ルーム <span className="text-cyan-300 font-bold">{roomCode}</span> に接続中...
        </p>
      </div>
    </Shell>
  );
}

export function RoomGate({ children }: { children: ReactNode }) {
  const roomCode = useAppStore((s) => s.roomCode);
  const status = useAppStore((s) => s.connectionStatus);
  const error = useAppStore((s) => s.connectionError);
  const connectToRoom = useAppStore((s) => s.connectToRoom);

  const [input, setInput] = useState('');
  const [attempted, setAttempted] = useState(false);
  const autoJoinedRef = useRef(false);

  useEffect(() => {
    if (autoJoinedRef.current || !isFirebaseConfigured()) return;
    autoJoinedRef.current = true;
    const saved = getSavedRoomCode();
    if (saved) {
      setInput(saved);
      connectToRoom(saved);
    }
  }, [connectToRoom]);

  if (!isFirebaseConfigured()) {
    return <ConfigMissingScreen />;
  }

  if (roomCode && status === 'connecting') {
    return <ConnectingScreen roomCode={roomCode} />;
  }

  if (roomCode && status === 'synced') {
    return <>{children}</>;
  }

  const handleSubmit = () => {
    setAttempted(true);
    const code = normalizeRoomCode(input);
    if (!code) return;
    connectToRoom(code);
  };

  const validationMessage = attempted && normalizeRoomCode(input) === '' ? 'ルームコードを入力してください。' : null;
  const connectionMessage = status === 'error' ? `接続に失敗しました: ${error ?? '不明なエラー'}` : null;

  return (
    <Shell>
      <div className="bg-panel-2/70 border border-slate-700/50 rounded-3xl p-6 md:p-8 backdrop-blur-md space-y-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <Radio className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <h2 className="font-black text-lg md:text-xl tracking-wide text-cyan-100">ルームに入る</h2>
        </div>
        <p className="relative z-10 text-sm text-slate-400 leading-relaxed">
          同じルームコードを入力した仲間同士で、雀士・対局データがリアルタイムに共有されます。
          初めての場合は好きなコードを入力すると新しいルームが作られます。
        </p>

        <ErrorBanner message={validationMessage ?? connectionMessage} />

        <div className="relative z-10 space-y-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="例: neon-tiger-482"
            className="w-full bg-abyss border border-slate-700/80 rounded-xl px-5 py-4 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 placeholder-slate-600 font-mono tracking-wide shadow-inner transition-all"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setInput(generateRoomCode())}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 transition-colors font-bold tracking-wide"
          >
            <Shuffle className="w-3.5 h-3.5" /> ランダムなコードを生成
          </button>
        </div>

        <NeonButton
          variant="primary"
          onClick={handleSubmit}
          disabled={status === 'connecting'}
          className="relative z-10 w-full"
        >
          <DoorOpen className="w-5 h-5 mr-2" /> ルームに入る
        </NeonButton>
      </div>
    </Shell>
  );
}
