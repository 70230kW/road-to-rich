import { BarChart3, Plus, Trophy, UserRound, X } from 'lucide-react';

const items = [
  { icon: UserRound, title: '名前を選ぶ', text: '上部のフローティングメニューから自分の名前を選択します。' },
  { icon: Plus, title: '対局を記録', text: '中央の「対局を記録」から半荘結果を入力します。' },
  { icon: BarChart3, title: '成績を分析', text: 'ダッシュボードで収支や勝率の変化を確認できます。' },
  { icon: Trophy, title: '段位・実績を育てる', text: '通算収支や達成条件に応じてキャリアが進みます。' },
];

export function WelcomeGuide({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
    <section className="mobile-sheet w-full sm:max-w-xl bg-panel border border-slate-700 rounded-t-[2rem] sm:rounded-[2rem] p-6">
      <div className="flex justify-between gap-4"><div><p className="eyebrow">QUICK START</p><h2 id="welcome-title" className="text-xl font-black mt-2">じゃんかねへようこそ</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="ガイドを閉じる"><X /></button></div>
      <div className="welcome-grid">{items.map(({ icon: Icon, title, text }, index) => <div key={title}><span>{index + 1}</span><Icon /><strong>{title}</strong><p>{text}</p></div>)}</div>
      <button type="button" className="solid-action w-full" onClick={onClose}>はじめる</button>
    </section>
  </div>;
}
