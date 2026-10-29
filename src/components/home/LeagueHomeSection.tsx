import { useMemo } from 'react';
import { ArrowUpRight, ArrowRight, Crown, Gamepad2, History, Plus } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useViewContext } from '../../store/useViewPreferences';
import { computeRanking, computePlayerRateStats } from '../../lib/stats';
import { computePlayerRankStatuses } from '../../lib/rankLevel';
import { rankPositions, gapToHigher } from '../../lib/rankingMovement';
import { formatSignedYen, formatRatePercentage } from '../../lib/format';
import { ScrambleText } from '../common/ScrambleText';
import { RankBadge } from '../common/RankBadge';
import { CurrentProfitsBar } from '../input/CurrentProfitsBar';

export function LeagueHomeSection({ onOpenRecord, onOpenMatch, onNavigate }: {
  onOpenRecord: () => void; onOpenMatch: () => void; onNavigate: (id: string) => void;
}) {
  const players = useAppStore(s => s.players);
  const history = useAppStore(s => s.history);
  const games = useAppStore(s => s.currentDayGames);
  const session = useAppStore(s => s.currentSession);
  const { activeId } = useViewContext();
  const ranking = useMemo(() => computeRanking(history, players), [history, players]);
  const positions = useMemo(() => rankPositions(ranking), [ranking]);
  const statuses = useMemo(() => computePlayerRankStatuses(history, players), [history, players]);
  const rates = useMemo(() => computePlayerRateStats(history, players), [history, players]);
  const recent = useMemo(() => [...history].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 3), [history]);
  const player = players.find(p => p.id === activeId);
  const row = ranking.find(r => r.playerId === activeId);
  const status = statuses[activeId];
  const gap = gapToHigher(ranking, activeId);
  const inProgress = Boolean(session || games.length);

  return <div className="league-hub">
    <header className="hub-heading"><div><p className="eyebrow">YOUR LEAGUE, YOUR STORY</p><h2>今日も、一局ずつ。</h2><p>仲間との記録を、あなたのキャリアに。</p></div><span className="hub-season">通算成績 ／ {players.length}人のリーグ</span></header>
    <div className="hub-primary-grid">
      <section className="hub-career" aria-label="あなたの通算成績">
        <div className="hub-card-top"><span className="eyebrow">MY CAREER</span>{status && <RankBadge status={status} />}</div>
        <h3>{player ? player.name + 'さんの現在地' : '最初の一局から、始めよう。'}</h3>
        <p className="hub-profit-label">通算収支 <span>場代抜き</span></p>
        <p className={'hub-profit ' + ((row?.totalProfitWithoutFee ?? 0) < 0 ? 'profit-negative' : 'profit-positive')}><ScrambleText text={row ? formatSignedYen(row.totalProfitWithoutFee) : '—'} /><small>円</small></p>
        <dl className="hub-metrics"><div><dt>リーグ順位</dt><dd>{positions[activeId] ?? '—'}<small>位</small></dd></div><div><dt>トップ率</dt><dd>{formatRatePercentage(rates[activeId]?.topRate)}</dd></div><div><dt>対局数</dt><dd>{row?.hanchanCount ?? 0}<small>半荘</small></dd></div></dl>
        {status && <div className="hub-rank-progress"><div><span>{status.nextLevelName ? status.nextLevelName + 'まで' : '最高段位に到達'}</span><strong>{status.profitToNextLevel === null ? '魂天' : 'あと ' + status.profitToNextLevel.toLocaleString() + '円'}</strong></div><progress value={status.progressRatio} max={1} aria-label="次の段位への進捗" /></div>}
        <button className="hub-text-link" type="button" onClick={() => onNavigate(player ? 'dashboard' : 'players')}>{player ? '個人成績を詳しく見る' : '雀士を登録する'}<ArrowUpRight size={18} /></button>
      </section>
      <section className={'hub-match ' + (inProgress ? 'is-live' : '')}>
        <div className="hub-card-top"><span className="eyebrow">{inProgress ? 'MATCH IN PROGRESS' : 'NEXT MATCH'}</span><Gamepad2 size={22} /></div>
        <div className="hub-match-copy"><span className="hub-status"><i />{inProgress ? '対局進行中' : '次の対局へ'}</span><h3>{session?.title ?? (games.length ? '精算前の対局があります' : '卓を囲む準備は、できた？')}</h3><p>{inProgress ? games.length + '半荘を記録済み。続きから入力できます。' : '参加する雀士を選んで、対局を始めましょう。'}</p></div>
        {inProgress ? <div aria-label="対局会の暫定順位"><CurrentProfitsBar games={games} players={players} participantIds={session?.participantIds} /></div> : <div className="hub-match-steps"><span><b>01</b>メンバーを選ぶ</span><span><b>02</b>素点を記録</span><span><b>03</b>まとめて精算</span></div>}
        <button type="button" className="hub-primary-button" onClick={onOpenMatch}><Plus size={19} />{inProgress ? '次の半荘を記録' : '対局会を始める'}<ArrowRight size={18} /></button>
        <button type="button" className="hub-text-link" onClick={onOpenRecord}>{inProgress ? '記録・精算メニューを開く' : '1半荘だけ記録する'}<ArrowUpRight size={16} /></button>
      </section>
    </div>
    <div className="hub-secondary-grid">
      <section className="hub-panel"><div className="hub-panel-heading"><h3><Crown size={18} />リーグ順位</h3><button type="button" onClick={() => onNavigate('ranking')}>全員を見る<ArrowUpRight size={16} /></button></div><p className="hub-caption">通算・場代抜き収支順</p>
        {ranking.slice(0, 5).map(r => <button type="button" key={r.playerId} className={'hub-ranking-row ' + (r.playerId === activeId ? 'is-you' : '')} onClick={() => onNavigate('ranking')}><span>{String(positions[r.playerId]).padStart(2, '0')}</span><strong>{r.name}{r.playerId === activeId && <small>YOU</small>}</strong><em className={r.totalProfitWithoutFee >= 0 ? 'profit-positive' : 'profit-negative'}>{formatSignedYen(r.totalProfitWithoutFee)}<small>円</small></em></button>)}
        {row && <p className="hub-ranking-note">{gap === null ? '現在、リーグトップの収支です。' : 'ひとつ上の収支まで、あと' + Math.ceil(gap).toLocaleString() + '円。'}</p>}
        {!ranking.length && <div className="hub-empty"><Crown size={24} /><p>最初の精算から、順位が動き出します。</p><button type="button" onClick={onOpenMatch}>対局を始める<ArrowRight size={16} /></button></div>}
      </section>
      <section className="hub-panel"><div className="hub-panel-heading"><h3><History size={18} />最近の対局</h3><button type="button" onClick={() => onNavigate('history')}>履歴へ<ArrowUpRight size={16} /></button></div><p className="hub-caption">選択中の雀士の収支・場代込み</p>
        {recent.map(day => { const entry = day.settlement[activeId]; return <button type="button" key={day.id} className="hub-history-row" onClick={() => onNavigate('history')}><span className="hub-date"><strong>{new Date(day.date).getDate()}</strong><small>{new Date(day.date).getMonth() + 1}月</small></span><span><strong>{day.session?.title ?? '通常対局'}</strong><small>{new Date(day.date).getFullYear()}年 · {day.games.length}半荘</small></span><em className={entry && entry.totalWithFee < 0 ? 'profit-negative' : 'profit-positive'}>{entry ? formatSignedYen(entry.totalWithFee) + '円' : '不参加'}</em></button>; })}
        {!recent.length && <div className="hub-empty"><History size={24} /><p>仲間との対局が、ここに積み重なります。</p><span>精算後に結果を表示します。</span></div>}
      </section>
    </div>
  </div>;
}
