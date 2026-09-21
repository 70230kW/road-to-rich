import { useState } from 'react';
import { Check, ChevronRight, Clock3, ScrollText } from 'lucide-react';
import { APP_UPDATES } from '../../data/updateHistory';
import { SectionHeader } from '../common/SectionHeader';

export function UpdateHistorySection() {
  const [selectedVersion, setSelectedVersion] = useState(APP_UPDATES[0].version);
  const selected = APP_UPDATES.find((update) => update.version === selectedVersion) ?? APP_UPDATES[0];

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeader icon={ScrollText} title="アプデ" accent="yellow" description="じゃんかねに追加・変更された内容を、バージョンごとに確認できます。" />

      <div className="updates-shell">
        <aside className="updates-sidebar" aria-label="アップデートバージョン">
          <div className="updates-sidebar-heading"><Clock3 size={14} /><span>UPDATE LOG</span></div>
          <nav>
            {APP_UPDATES.map((update) => {
              const selectedItem = update.version === selected.version;
              return (
                <button key={update.version} type="button" aria-current={selectedItem ? 'page' : undefined} onClick={() => setSelectedVersion(update.version)}>
                  <span>Ver. {update.version}</span>
                  <small>{update.date}</small>
                  <ChevronRight size={14} />
                </button>
              );
            })}
          </nav>
        </aside>

        <article className="updates-content" aria-live="polite">
          <header className="updates-version-header">
            <div><span>LATEST PATCH NOTES</span><h2>Ver. {selected.version}</h2><p>{selected.date}</p></div>
            {selected === APP_UPDATES[0] && <strong><Check size={13} />最新</strong>}
          </header>
          <div className="updates-intro"><h3>{selected.title}</h3><p>{selected.summary}</p></div>
          <div className="updates-table-wrap">
            <table className="updates-table">
              <thead><tr><th scope="col">対象</th><th scope="col">変更内容</th></tr></thead>
              <tbody>{selected.items.map((item, index) => <tr key={`${item.target}-${index}`}><th scope="row">{item.target}</th><td>{item.change}</td></tr>)}</tbody>
            </table>
          </div>
          <footer className="updates-footer"><span>JANKANE UPDATE DATA</span><span>{selected.items.length} CHANGES</span></footer>
        </article>
      </div>
    </div>
  );
}
