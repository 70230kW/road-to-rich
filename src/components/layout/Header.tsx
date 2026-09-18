import { Club } from 'lucide-react';

export function Header() {
  return (
    <header className="app-header">
      <div className="brand-lockup"><span className="brand-mark"><Club size={23} /></span><div>
        <h1 className="font-brand text-lg tracking-wider text-white">じゃんかね</h1>
        <p className="eyebrow mt-1">ROAD TO RICH</p>
      </div></div>
      <span className="league-label"><span /> MAHJONG LEAGUE</span>
    </header>
  );
}
