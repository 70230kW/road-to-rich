import { useMemo, useState } from 'react';
import { Archive, CalendarRange, Crown, Flag, Plus, Trophy } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { computeSeasonSnapshot } from '../../lib/seasonArchive';
import { formatSignedYen } from '../../lib/format';
import { SectionHeader } from '../common/SectionHeader';
import { NeonButton } from '../common/NeonButton';
import { ConfirmDialog } from '../common/ConfirmDialog';

function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function SeasonArchiveSection() {
  const seasons = useAppStore((s) => s.seasons);
  const activeSeasonId = useAppStore((s) => s.activeSeasonId);
  const history = useAppStore((s) => s.history);
  const players = useAppStore((s) => s.players);
  const createSeason = useAppStore((s) => s.createSeason);
  const archiveSeason = useAppStore((s) => s.archiveSeason);
  const [name, setName] = useState(`${new Date().getFullYear()} SEASON`);
  const [startDate, setStartDate] = useState(today);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [saving, setSaving] = useState(false);

  const active = seasons.find((season) => season.id === activeSeasonId && season.status === 'active') ?? null;
  const archived = useMemo(() => seasons.filter((season) => season.status === 'archived').sort((a, b) => b.startDate.localeCompare(a.startDate)), [seasons]);
  const activeSnapshot = useMemo(() => active ? computeSeasonSnapshot(history, players, active) : null, [active, history, players]);

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeader icon={CalendarRange} title="シーズン" accent="yellow" description="リーグの開催期間を区切り、歴代王者とシーズン記録を保存します。" />

      {active && activeSnapshot ? (
        <section className="season-active-card">
          <div className="season-active-heading"><div><span className="season-status"><i />開催中</span><h3>{active.name}</h3><p>{active.startDate.replaceAll('-', '.')} — NOW</p></div><Crown size={42} /></div>
          <div className="season-overview-grid"><div><span>対局日数</span><strong>{activeSnapshot.days.length}日</strong></div><div><span>総半荘数</span><strong>{activeSnapshot.hanchanCount}半荘</strong></div><div><span>暫定首位</span><strong>{activeSnapshot.champion?.name ?? '記録待ち'}</strong></div><div><span>最多トップ</span><strong>{activeSnapshot.topHunter ? `${activeSnapshot.topHunter.name} ${activeSnapshot.topHunter.count}回` : '記録待ち'}</strong></div></div>
          {activeSnapshot.ranking.length > 0 && <div className="season-mini-ranking">{activeSnapshot.ranking.slice(0, 5).map((row, index) => <div key={row.playerId}><span>{index + 1}</span><strong>{row.name}</strong><em className={row.totalProfitWithoutFee >= 0 ? 'profit-positive' : 'profit-negative'}>{formatSignedYen(row.totalProfitWithoutFee)}</em></div>)}</div>}
          <button type="button" className="season-archive-action" onClick={() => setConfirmingArchive(true)}><Archive size={16} />シーズンを終了して保存</button>
          <ConfirmDialog open={confirmingArchive} title="シーズンを終了" message={`${active.name}を本日付で終了し、最終順位をアーカイブします。以降の対局は新しいシーズンを作るまで通算記録のみに反映されます。`} confirmLabel="シーズンを終了" onCancel={() => setConfirmingArchive(false)} onConfirm={async () => { await archiveSeason(active.id, today()); setConfirmingArchive(false); }} />
        </section>
      ) : (
        <section className="season-create-card">
          <div><span className="eyebrow">NEW SEASON</span><h3>新しいシーズンを開始</h3><p>開始後に精算した対局会は、自動的にこのシーズンへ記録されます。</p></div>
          <label><span>シーズン名</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label><span>開始日</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <NeonButton variant="primary" disabled={!name.trim() || !startDate || saving} onClick={async () => { setSaving(true); await createSeason(name, startDate); setSaving(false); }}><Plus size={17} className="mr-2" />{saving ? '開始中…' : 'シーズンを開始'}</NeonButton>
        </section>
      )}

      <section className="unified-section">
        <div className="content-section-header"><div><span className="eyebrow">HALL OF SEASONS</span><h3>シーズンアーカイブ</h3></div><small>{archived.length}シーズン</small></div>
        {archived.length === 0 ? <p className="season-empty">終了したシーズンはまだありません。</p> : <div className="season-archive-grid">{archived.map((season) => {
          const snapshot = computeSeasonSnapshot(history, players, season);
          return <article key={season.id}><div className="season-archive-title"><Trophy size={18} /><div><strong>{season.name}</strong><small>{season.startDate.replaceAll('-', '.')} — {season.endDate?.replaceAll('-', '.') ?? '-'}</small></div></div><div className="season-champion"><span>CHAMPION</span><strong>{snapshot.champion?.name ?? '記録なし'}</strong><em>{snapshot.champion ? formatSignedYen(snapshot.champion.totalProfitWithoutFee) : '-'}</em></div><footer><span><Flag size={12} />{snapshot.hanchanCount}半荘</span><span>{snapshot.days.length}日間</span></footer></article>;
        })}</div>}
      </section>
    </div>
  );
}
