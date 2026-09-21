import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HanchanForm } from '../components/input/HanchanForm';
import { PeriodFilter } from '../components/common/PeriodFilter';
import { RankPromotion } from '../components/layout/RankPromotion';
import { useViewPreferences, readViewPreferences, resolvePeriod, VIEW_STORAGE_KEY } from '../store/useViewPreferences';
import { useAppStore } from '../store/useAppStore';
import { adjacentProfitGap, gapToHigher, rankPositions, rankingComparison } from '../lib/rankingMovement';
import { computeRanking } from '../lib/stats';
import type { DayRecord, PlayerCount } from '../types';
const players = ['a','b','c','d'].map(id => ({id,name:id,color:'#aaaaaa'}));
function day(date: string, values: number[]): DayRecord {
  return {id:date,date,games:[],chips:{},chipRate:100,tableFee:0,settlement:Object.fromEntries(values.map((value,i)=>[players[i].id,{gamesTotal:value,chipCount:0,chipValue:0,tableFeeShare:0,totalWithoutFee:value,totalWithFee:value}]))};
}
beforeEach(() => {localStorage.clear(); useViewPreferences.setState({rooms:{}}); useAppStore.setState({roomCode:'room1',players,history:[],connectionStatus:'synced'});});
afterEach(cleanup);
describe('personal league context', () => {
  it('remembers separate room choices and safely reads corrupted storage', () => {
    useViewPreferences.getState().update('room1',{playerId:'b',period:'previousMonth'});
    useViewPreferences.getState().update('room2',{playerId:'c',period:'year'});
    expect(readViewPreferences().room1.playerId).toBe('b');
    expect(readViewPreferences().room2.period).toBe('year');
    localStorage.setItem(VIEW_STORAGE_KEY,'{bad');
    expect(readViewPreferences()).toEqual({});
    expect(resolvePeriod('previousMonth','all',new Date(2026,0,15))).toEqual({year:2025,month:12});
  });
  it('preserves the selected period after a screen remount', () => {
    const view=render(<PeriodFilter/>);
    fireEvent.click(screen.getByRole('button',{name:'先月'})); view.unmount();
    render(<PeriodFilter/>);
    expect(screen.getByRole('button',{name:'先月'})).toHaveAttribute('aria-pressed','true');
  });
  it('handles tied ranks, nearest higher gap, and January comparison', () => {
    const history=[day('2025-12-15T12:00:00+09:00',[100,100,-50,-150])];
    const rows=computeRanking(history,players);
    expect(rankPositions(rows)).toEqual({a:1,b:1,c:3,d:4});
    expect(gapToHigher(rows,'c')).toBe(150);
    expect(gapToHigher(rows,'a')).toBeNull();
    expect(adjacentProfitGap(rows, 0)).toEqual({amount:0,referencePlayerId:'b'});
    expect(adjacentProfitGap(rows, 2)).toEqual({amount:-150,referencePlayerId:'b'});
    expect(rankingComparison(history,players,{year:2026,month:1})).toEqual({positions:{a:1,b:1,c:3,d:4},label:'2025年12月の順位比'});
    expect(rankingComparison([],players,'all').positions).toEqual({});
  });
  it('celebrates a real increase but not the first synchronized rank', () => {
    useAppStore.setState({history:[day('2026-09-01',[0,0,0,0])]});
    render(<RankPromotion/>);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    act(()=>useAppStore.setState({history:[day('2026-09-01',[600000,0,0,0])]}));
    expect(screen.getByRole('status')).toHaveTextContent('昇段');
    act(()=>useAppStore.setState({roomCode:'room2'}));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
function form(count: PlayerCount, save: () => Promise<void>) {
  render(<HanchanForm players={players} settings={{playerCount:count,initialScore:25000,divider:10,rankPoints4:[30,10,-10,-30],rankPoints3:[20,0,-20]}} currentDayGames={[]} onAddGame={save} onRemoveGame={vi.fn()} onUpdateGameYakuman={vi.fn()} onStartSettling={vi.fn()} onNavigateToPlayers={vi.fn()} onSetPlayerCount={vi.fn()}/>);
  for(let i=0;i<count;i++) fireEvent.change(screen.getByRole('combobox',{name:`席${i+1}の雀士`}),{target:{value:players[i].id}});
  for(let i=0;i<count-1;i++) fireEvent.change(screen.getByRole('spinbutton',{name:`席${i+1}の素点 (百点単位)`}),{target:{value:String(300-i*50)}});
}
describe('confirmed score saving', () => {
  it.each([3,4] as const)('waits for acknowledgement and prevents duplicate saves with %i players', async count => {
    let resolve!:()=>void; const save=vi.fn(()=>new Promise<void>(r=>{resolve=r;})); form(count,save);
    const button=screen.getByRole('button',{name:'この半荘を記録する'});
    fireEvent.click(button); fireEvent.click(button);
    expect(save).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('半荘を保存しました')).not.toBeInTheDocument();
    expect(screen.getByRole('spinbutton',{name:'席1の素点 (百点単位)'})).toBeDisabled();
    await act(async()=>resolve());
    expect(screen.getByRole('heading',{name:'半荘を保存しました'})).toHaveFocus();
    expect(screen.getByRole('button',{name:'次の半荘へ'})).toBeInTheDocument();
  });
  it('retains scores on failure and supports retry', async () => {
    const save=vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined); form(4,save);
    fireEvent.click(screen.getByRole('button',{name:'この半荘を記録する'}));
    await waitFor(()=>expect(screen.getByText(/保存できませんでした/)).toBeInTheDocument());
    expect(screen.getByRole('spinbutton',{name:'席1の素点 (百点単位)'})).toHaveValue(300);
    fireEvent.click(screen.getByRole('button',{name:'この半荘を記録する'}));
    await screen.findByRole('heading',{name:'半荘を保存しました'});
    expect(save).toHaveBeenCalledTimes(2);
  });
});
