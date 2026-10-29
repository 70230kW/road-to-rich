import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { computeRecentTrends } from '../lib/recentTrends';
import { RecentTrends } from '../components/dashboard/RecentTrends';
import type { DayRecord, PlayerCount } from '../types';
import { DashboardSection } from '../components/dashboard/DashboardSection';
import { useAppStore } from '../store/useAppStore';
import { useViewPreferences } from '../store/useViewPreferences';

function record(n: number, count: PlayerCount = 4, target = 'a', id = 'day'): DayRecord {
  return { id, date: '2026-10-30T00:00:00Z', tableFee: 1000, chipRate: 200, chips: { a: 100 }, settlement: {},
    games: Array.from({ length: n }, (_, index) => ({ id: String(index), scores: Array.from({ length: count }, (_, seat) => ({ playerId: seat ? `p${seat}` : target, rank: seat ? seat + 1 : index < 20 ? count : 1, point: seat ? -100 : index < 20 ? -100 : 300, rawScore: 25000 })) })) };
}
afterEach(cleanup);

describe('equal-sample recent trends', () => {
  it('compares two disjoint groups of 20, excluding chips, table fees and older games', () => {
    const result = computeRecentTrends([record(40)], 'a', 4);
    expect(result.ready).toBe(true);
    expect(result.previous).toMatchObject({ count: 20, topRate: 0, avoidLastRate: 0, avgRank: 4, profit: -2000 });
    expect(result.recent).toMatchObject({ count: 20, topRate: 1, avoidLastRate: 1, avgRank: 1, profit: 6000 });
    expect(result.previous.last?.number).toBe(20);
    expect(result.recent.first?.number).toBe(21);
    expect(result.contributions[0]).toMatchObject({ count: 20, profit: 6000 });
    const more = computeRecentTrends([record(45)], 'a', 4);
    expect(more.previous.first?.number).toBe(6); expect(more.recent.first?.number).toBe(26);
  });
  it.each([0, 1, 19, 20, 21, 39])('does not claim a comparison for %i games', n => {
    const result = computeRecentTrends([record(n)], 'a', 4);
    expect(result.ready).toBe(false); expect(result.missing).toBe(40 - n);
    expect(result.recent.count).toBe(Math.min(20, n)); expect(result.previous.count).toBe(Math.max(0, n - 20));
    if (n === 0) expect(result.recent.topRate).toBeNull();
  });
  it('separates three/four player formats, missing participants and sorts history chronologically without mutation', () => {
    const early = { ...record(20, 4, 'a', 'early'), date: '2026-01-01T00:00:00Z' };
    const late = record(20, 4, 'a', 'late');
    const history = [late, record(5, 3), early, record(20, 4, 'someone-else')];
    const original = JSON.stringify(history);
    const result = computeRecentTrends(history, 'a', 4);
    expect(result.total).toBe(40); expect(result.previous.first?.dayId).toBe('early'); expect(result.recent.first?.dayId).toBe('late');
    expect(computeRecentTrends(history, 'a', 3).recent.avoidLastRate).toBe(0);
    expect(JSON.stringify(history)).toBe(original);
  });
  it('shows exact samples, one-decimal rates, percentage points and ranked session contributions', () => {
    render(<RecentTrends history={[record(40)]} playerId="a" periodLabel="2026年" />);
    const table = within(screen.getByRole('table'));
    expect(table.getAllByText('100.0%')).toHaveLength(2);
    expect(table.getAllByText('+100.0pt')).toHaveLength(2);
    expect(screen.getByText(/第21半荘〜/)).toBeInTheDocument();
    expect(screen.getByText(/対象20半荘/)).toBeInTheDocument();
    expect(screen.getByText(/実力や打ち方の評価ではありません/)).toBeInTheDocument();
  });
  it('keeps partial samples informational and updates on format/player/period changes', () => {
    const view = render(<RecentTrends history={[record(39), record(40, 3)]} playerId="a" periodLabel="通算" />);
    expect(screen.getByRole('status')).toHaveTextContent('あと1半荘');
    expect(screen.queryByText('+100.0pt')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '3人麻雀' }));
    expect(screen.getByRole('status')).toHaveTextContent('20半荘に比べて');
    view.rerender(<RecentTrends history={[]} playerId="b" periodLabel="今月" />);
    expect(screen.getByText(/比較できる半荘がありません/)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
  it('is connected to the real dashboard period and global player selection', () => {
    useViewPreferences.setState({ rooms: {} });
    useAppStore.setState({ roomCode: 'quality-dashboard', history: [record(40)], players: [{ id: 'a', name: '雀士A', color: '#ffffff' }, { id: 'b', name: '雀士B', color: '#eeeeee' }] });
    render(<DashboardSection />);
    const trends = within(screen.getByRole('region', { name: '数字で見る、最近の変化' }));
    expect(trends.getByRole('table')).toBeInTheDocument();
    act(() => useViewPreferences.getState().update('quality-dashboard', { playerId: 'b' }));
    expect(trends.queryByRole('table')).not.toBeInTheDocument();
    act(() => useViewPreferences.getState().update('quality-dashboard', { playerId: 'a', period: 'custom', customSeason: { year: 2025, month: 'all' } }));
    expect(trends.getByText(/比較できる半荘がありません/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '通算' }));
    expect(trends.getByRole('table')).toBeInTheDocument();
  });
});
