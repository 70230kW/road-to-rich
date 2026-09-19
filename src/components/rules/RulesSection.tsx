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
      <SectionHeader icon={BookOpen} title="ルール" accent="emerald" description="対局前でも迷わず確認できる、リーグ共通のルールブックです。" />

      <div className="page-overview page-overview-emerald">
        <div><span>収録ルール</span><strong>{RULES.length}項目</strong></div>
        <div><span>準拠</span><strong>Mリーグ</strong></div>
        <p>Mリーグの対局ルールを掲載しています。点数計算は、このアプリ独自の「計算設定」で管理します。</p>
      </div>

      <div className="rule-search">
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
        <EmptyState icon={Search} message="該当するルールがありません" hint="別のキーワードで検索してみてください。" />
      ) : (
        <section className="unified-section">
          <div className="content-section-header"><div><span className="eyebrow">RULE BOOK</span><h3>ルール一覧</h3></div><small>{filtered.length}件を表示</small></div>
          <div className="rules-grid">
          {filtered.map((rule, index) => (
            <div
              key={rule.id}
              className="rule-card"
            >
              <span className="rule-index">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="font-black text-slate-100 text-base md:text-lg tracking-wide mb-2">{rule.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{rule.description}</p>
            </div>
          ))}
          </div>
        </section>
      )}
    </div>
  );
}
