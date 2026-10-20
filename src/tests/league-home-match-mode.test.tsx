import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LeagueHomeSection } from '../components/home/LeagueHomeSection';
import { CurrentProfitsBar } from '../components/input/CurrentProfitsBar';
import { MatchResultSequence } from '../components/input/MatchResultSequence';
import { defaultSettings, useAppStore } from '../store/useAppStore';
import { useViewPreferences } from '../store/useViewPreferences';
import type { DayRecord, Player } from '../types';

const players: Player[] = [
  { id: 'a', name: '和賀', color: '#d9bd82' },
  { id: 'b', name: '佐野', color: '#68d5a3' },
  { id: 'c', name: '船井', color: '#72a7d9' },
  { id: 'd', name: '田中', color: '#d97878' },
];

function resultDay(): DayRecord {
  return {
    id: 'result-1',
    date: '2026-10-21T12:00:00+09:00',
    games: [{
      id: 'game-1',
      scores: [
        { playerId: 'a', rawScore: 50000, rank: 1, point: 5500 },
        { playerId: 'b', rawScore: 25000, rank: 2, point: 1000 },
        { playerId: 'c', rawScore: 15000, rank: 3, point: -2000 },
        { playerId: 'd', rawScore: 10000, rank: 4, point: -4500 },
      ],
    }],
    tableFee: 0,
    chips: { a: 0, b: 0, c: 0, d: 0 },
    chipRate: 200,
    settlement: {
      a: { gamesTotal: 5500, chipCount: 0, chipValue: 0, tableFeeShare: 0, totalWithoutFee: 5500, totalWithFee: 5500 },
      b: { gamesTotal: 1000, chipCount: 0, chipValue: 0, tableFeeShare: 0, totalWithoutFee: 1000, totalWithFee: 1000 },
      c: { gamesTotal: -2000, chipCount: 0, chipValue: 0, tableFeeShare: 0, totalWithoutFee: -2000, totalWithFee: -2000 },
      d: { gamesTotal: -4500, chipCount: 0, chipValue: 0, tableFeeShare: 0, totalWithoutFee: -4500, totalWithFee: -4500 },
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  useViewPreferences.setState({ rooms: {} });
  useAppStore.setState({
    roomCode: 'room-home',
    players,
    settings: defaultSettings,
    history: [],
    currentDayGames: [],
    currentSession: null,
  });
});

afterEach(cleanup);

describe('league home', () => {
  it('turns into a match command center while a session is active', () => {
    useAppStore.setState({
      currentSession: { id: 'session-1', title: '水曜対局会', participantIds: players.map((player) => player.id), startedAt: '2026-10-21T10:00:00+09:00' },
      currentDayGames: resultDay().games,
    });
    const onOpenMatch = vi.fn();
    render(<LeagueHomeSection onOpenRecord={vi.fn()} onOpenMatch={onOpenMatch} onNavigate={vi.fn()} />);

    expect(screen.getByRole('heading', { name: '水曜対局会' })).toBeInTheDocument();
    expect(screen.getByLabelText('対局会の暫定順位')).toHaveTextContent('和賀');
    fireEvent.click(screen.getByRole('button', { name: /次の半荘を記録/ }));
    expect(onOpenMatch).toHaveBeenCalledOnce();
  });
});

describe('live standings during input', () => {
  it('immediately reorders the table when valid draft scores are supplied', () => {
    render(
      <CurrentProfitsBar
        games={[{ id: 'saved', scores: [
          { playerId: 'a', rawScore: 40000, rank: 1, point: 1000 },
          { playerId: 'b', rawScore: 20000, rank: 2, point: -1000 },
        ] }]}
        players={players}
        participantIds={['a', 'b']}
        previewScores={[
          { playerId: 'b', rawScore: 50000, rank: 1, point: 3000 },
          { playerId: 'a', rawScore: 10000, rank: 2, point: -3000 },
        ]}
      />,
    );

    expect(screen.getByText('入力中の半荘を反映')).toBeInTheDocument();
    const rows = within(screen.getByLabelText('入力中の暫定順位')).getAllByText(/和賀|佐野/);
    expect(rows.map((row) => row.textContent)).toEqual(['佐野', '和賀']);
  });
});

describe('match result sequence', () => {
  it('shows final order, league impact, new records and achievements in stages', () => {
    render(<MatchResultSequence title="水曜対局会" resultDay={resultDay()} historyBefore={[]} players={players} settings={defaultSettings} onComplete={vi.fn()} />);

    expect(screen.getByRole('heading', { name: '水曜対局会' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /リーグ変動/ }));
    expect(screen.getByRole('heading', { name: '順位・段位の変化' })).toBeInTheDocument();
    expect(document.querySelectorAll('.match-result-changes > div')).toHaveLength(4);
    expect(document.querySelector('.match-result-changes')).toHaveTextContent('初参加');

    fireEvent.click(screen.getByRole('tab', { name: /ハイライト/ }));
    expect(screen.getByRole('heading', { name: '記録と実績' })).toBeInTheDocument();
    expect(screen.getAllByText('自己最高素点を更新')).toHaveLength(4);
    expect(screen.getAllByText('新しい実績を解除').length).toBeGreaterThan(0);
  });
});
