import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DashboardSection } from '../components/dashboard/DashboardSection';
import { RankingSection } from '../components/ranking/RankingSection';
import { RankSection } from '../components/rank/RankSection';
import { useAppStore } from '../store/useAppStore';
import { useViewPreferences } from '../store/useViewPreferences';
import type { DayRecord } from '../types';
const players = [{ id: 'a', name: '春樹', color: '#aaaaaa' }, { id: 'b', name: '直人', color: '#bbbbbb' }];
const history: DayRecord[] = [{ id:'day', date:'2026-09-10T12:00:00+09:00', games:[{id:'g', scores:[{playerId:'a', rawScore:40000, rank:1, point:3000}, {playerId:'b', rawScore:20000, rank:2, point:-3000}]}], tableFee:1000, chips:{a:0,b:0}, chipRate:100, settlement:{a:{gamesTotal:3000,chipCount:0,chipValue:0,tableFeeShare:500,totalWithoutFee:3000,totalWithFee:2500},b:{gamesTotal:-3000,chipCount:0,chipValue:0,tableFeeShare:500,totalWithoutFee:-3000,totalWithFee:-3500}} }];
afterEach(cleanup);
function seed() { useViewPreferences.setState({rooms:{}}); useAppStore.setState({players,history}); }
describe('premium league screens', () => {
  it('switches personal metrics without changing stored results, including empty seasons', () => {
    seed(); render(<DashboardSection />);
    expect(screen.getByText('100.0%')).toBeInTheDocument();
    useViewPreferences.getState().update('__local__', {playerId:'b'});
    cleanup(); render(<DashboardSection />);
    expect(screen.getByText('0.0%')).toBeInTheDocument();
    expect(screen.getByText('2.00')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name:/年月指定/}));
    fireEvent.change(screen.getByRole('combobox',{name:'シーズンを選択'}), {target:{value:'2026:1'}});
    expect(screen.getByText('この期間の成績はありません')).toBeInTheDocument();
    expect(useAppStore.getState().history).toEqual(history);
  });
  it('renders a two-player podium and keeps details available', () => {
    seed(); render(<RankingSection />);
    expect(screen.getByRole('button',{name:'1位 春樹の成績詳細'})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'2位 直人の成績詳細'})).toBeInTheDocument();
    expect(screen.queryByRole('button',{name:/3位 .*の成績詳細/})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'1位 春樹の成績詳細'}));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
  it('uses lifetime profit for rank and handles the top and bottom tiers', () => {
    seed();
    useAppStore.setState({history:[{...history[0],settlement:{...history[0].settlement,a:{...history[0].settlement.a,totalWithoutFee:600000},b:{...history[0].settlement.b,totalWithoutFee:-200000}}}]});
    render(<RankSection />);
    expect(screen.getByText('最高段位に到達しました！')).toBeInTheDocument();
    useViewPreferences.getState().update('__local__', {playerId:'b'});
    cleanup(); render(<RankSection />);
    expect(screen.getByText('¥120,000')).toBeInTheDocument();
    expect(screen.getByRole('progressbar').getAttribute('value')).toBe('0');
  });
});
