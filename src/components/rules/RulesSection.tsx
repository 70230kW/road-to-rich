import { useMemo, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { RULES } from '../../lib/rules';
import { SectionHeader } from '../common/SectionHeader';
import { EmptyState } from '../common/EmptyState';

export function RulesSection() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return RULES;
    return RULES.filter((r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeader icon={BookOpen} title="ルール" accent="emerald" />

      <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
        Mリーグの対局ルールを掲載しています（点数計算はこのアプリ独自の「計算設定」で運用するため含みません）。
      </p>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ルールを検索（例: チョンボ、連荘、赤ドラ）"
          className="w-full bg-abyss border border-slate-700/80 rounded-xl pl-11 pr-5 py-3.5 text-slate-100 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 placeholder-slate-600 font-bold tracking-wide shadow-inner transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} message="No Results" hint="別のキーワードで検索してみてください。" />
      ) : (
        <div className="space-y-4">
          {filtered.map((rule) => (
            <div
              key={rule.id}
              className="bg-panel-2/60 p-5 md:p-6 rounded-2xl border border-slate-700/50 hover:border-emerald-800/60 transition-colors backdrop-blur-sm"
            >
              <h3 className="font-black text-slate-100 text-base md:text-lg tracking-wide mb-2">{rule.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{rule.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
