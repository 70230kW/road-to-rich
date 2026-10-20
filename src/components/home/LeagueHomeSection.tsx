import { useMemo } from 'react';
import { ArrowRight, BarChart3, Crown, Gamepad2, History, House, Play, Target, Users } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useViewContext } from '../../store/useViewPreferences';
import { computeRanking } from '../../lib/stats';
import { computePlayerRankStatuses } from '../../lib/rankLevel';
import { rankPositions } from '../../lib/rankingMovement';
import { formatSignedYen } from '../../lib/format';
import { SectionHeader } from '../common/SectionHeader';
import { ScrambleText } from '../common/ScrambleText';
import { RankEmblem } from '../common/RankEmblem';

export function LeagueHomeSection({
  onOpenRecord,
  onOpenMatch,
  onNavigate,
}: {
  onOpenRecord: () => void;
  onOpenMatch: () => void;
  onNavigate: (id: string) => void;
}) {
  const players = useAppStore((state) => state.players);
  const history = useAppStore((state) => state.history);
  const games = useAppStore((state) => state.currentDayGames);
  const session = useAppStore((state) => state.currentSession);
  const { activeId } = useViewContext();

  const ranking = useMemo(() => computeRanking(history, players), [history, players]);
  const positions = useMemo(() => rankPositions(ranking), [ranking]);
  const statuses = useMemo(() => computePlayerRankStatuses(history, players), [history, players]);
  const activePlayer = players.find((player) => player.id === activeId);
  const activeRow = ranking.find((row) => row.playerId === activeId);
  const activeStatus = statuses[activeId];
  const recentDay = useMemo(
    () => [...history].sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0] ?? null,
    [history],
  );

  const liveStandings = useMemo(() => {
    if (!session) return [];
    const totals = new Map(session.participantIds.map((id) => [id, 0]));
    games.forEach((game) => game.scores.forEach((score) => {
      totals.set(score.playerId, (totals.get(score.playerId) ?? 0) + score.point);
    }));
    return session.participantIds.map((id) => ({
      id,
      name: players.find((player) => player.id === id)?.name ?? '不明',
      color: players.find((player) => player.id === id)?.color,
      point: totals.get(id) ?? 0,
    })).sort((a, b) => b.point - a.point);
  }, [games, players, session]);

  return (
    <div className="space-y-7 animate-fade-in">
      <SectionHeader icon={House} title="リーグホーム" description="いまの状況と、次にやることをひとつの画面にまとめます。" />

      {session ? (
        <section className="home-live-session">
          <div className="home-live-heading">
            <div><span className="session-live-dot" /><div><p className="eyebrow">MATCH IN PROGRESS</p><h3>{session.title}</h3></div></div>
            <strong><ScrambleText text={String(games.length)} /><small>半荘</small></strong>
          </div>
          <div className="home-live-standings" aria-label="対局会の暫定順位">
            {liveStandings.map((row, index) => (
              <div key={row.id} className={index === 0 ? 'is-leading' : ''}>
                <span>{index + 1}</span><i style={{ backgroundColor: row.color }} /><strong>{row.name}</strong>
                <em className={row.point >= 0 ? 'profit-positive' : 'profit-negative'}>{formatSignedYen(row.point)}</em>
              </div>
            ))}
          </div>
          <button type="button" className="home-primary-action" onClick={onOpenMatch}>
            <Gamepad2 aria-hidden="true" /><span><strong>次の半荘を記録</strong><small>入力中も暫定順位を確認できます</small></span><ArrowRight aria-hidden="true" />
          </button>
        </section>
      ) : (
        <section className="home-start-card">
          <div><p className="eyebrow">READY FOR THE NEXT TABLE</p><h3>次の対局を始めましょう</h3><p>対局会を設定するか、1半荘だけすぐに記録できます。</p></div>
          <div className="home-start-actions">
            <button type="button" className="home-primary-action" onClick={onOpenMatch}><Play aria-hidden="true" /><span><strong>対局会を開始</strong><small>参加雀士と対局会名を設定</small></span><ArrowRight aria-hidden="true" /></button>
            <button type="button" className="home-secondary-action" onClick={onOpenRecord}><Gamepad2 aria-hidden="true" />1半荘だけ記録</button>
          </div>
        </section>
      )}

      {activePlayer && activeStatus ? (
        <section className="home-player-card">
          <div className="home-player-identity"><RankEmblem status={activeStatus} compact /><div><p className="eyebrow">YOUR STATUS</p><h3>{activePlayer.name}</h3><span>{activeStatus.levelName} · {positions[activeId] ? `${positions[activeId]}位` : '記録待ち'}</span></div></div>
          <div className="home-player-profit"><span>通算収支</span><strong className={(activeRow?.totalProfitWithoutFee ?? 0) >= 0 ? 'profit-positive' : 'profit-negative'}><ScrambleText text={activeRow ? formatSignedYen(activeRow.totalProfitWithoutFee) : '¥0'} /></strong><small>場代抜き</small></div>
          <div className="home-player-progress"><div><span>{activeStatus.nextLevelName ?? '最高段位'}</span><small>{activeStatus.profitToNextLevel === null ? '到達済み' : `あと ¥${activeStatus.profitToNextLevel.toLocaleString()}`}</small></div><progress value={activeStatus.progressRatio} max={1} aria-label="次の段位への進捗" /></div>
          <button type="button" onClick={() => onNavigate('dashboard')}>個人成績を見る <ArrowRight size={15} /></button>
        </section>
      ) : (
        <section className="home-empty-card"><Users aria-hidden="true" /><div><strong>雀士を登録するとホームが完成します</strong><p>順位、段位、直近成績をここから確認できるようになります。</p></div><button type="button" onClick={() => onNavigate('players')}>雀士登録へ</button></section>
      )}

      <div className="home-overview-grid">
        <section className="premium-panel home-ranking-preview">
          <div className="section-kicker"><h3><Crown size={16} /> リーグ順位</h3><button type="button" onClick={() => onNavigate('ranking')}>すべて見る</button></div>
          {ranking.slice(0, 3).map((row, index) => <div key={row.playerId}><span>{index + 1}</span><strong>{row.name}</strong><em className={row.totalProfitWithoutFee >= 0 ? 'profit-positive' : 'profit-negative'}>{formatSignedYen(row.totalProfitWithoutFee)}</em></div>)}
          {ranking.length === 0 && <p className="muted text-xs py-5">精算を保存すると順位が表示されます。</p>}
        </section>
        <section className="premium-panel home-recent-preview">
          <div className="section-kicker"><h3><History size={16} /> 直近の対局</h3><button type="button" onClick={() => onNavigate('history')}>履歴を見る</button></div>
          {recentDay ? <><strong>{recentDay.session?.title ?? '通常対局'}</strong><p>{new Date(recentDay.date).toLocaleDateString('ja-JP')} · {recentDay.games.length}半荘</p><div>{Object.entries(recentDay.settlement).sort(([, a], [, b]) => b.totalWithoutFee - a.totalWithoutFee).slice(0, 3).map(([id, entry], index) => <span key={id}>{index + 1}位 {players.find((player) => player.id === id)?.name ?? '不明'} <em className={entry.totalWithoutFee >= 0 ? 'profit-positive' : 'profit-negative'}>{formatSignedYen(entry.totalWithoutFee)}</em></span>)}</div></> : <p className="muted text-xs py-5">最初の対局結果を待っています。</p>}
        </section>
      </div>

      <button type="button" className="home-analysis-link" onClick={() => onNavigate('dashboard')}><BarChart3 aria-hidden="true" /><span><strong>リーグ分析を開く</strong><small>個人成績とリーグ全体の傾向を確認</small></span><Target aria-hidden="true" /></button>
    </div>
  );
}
