import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DayRecord, Repayment } from '../types';
import { calculatePaymentPlan } from '../lib/payments';
const mocks = vi.hoisted(() => ({ records: new Map<string, unknown>(), writes: [] as { path: string; data: unknown }[], fail: false, runTransaction: vi.fn() }));
vi.mock('../lib/firebase', () => ({ getFirebaseDb: () => 'db' }));
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...parts: string[]) => ({ path: parts.join('/') }),
  collection: (_db: unknown, ...parts: string[]) => ({ path: parts.join('/') }),
  runTransaction: mocks.runTransaction,
  deleteDoc: vi.fn(), getDoc: vi.fn(), getDocs: vi.fn(), onSnapshot: vi.fn(), orderBy: vi.fn(), query: vi.fn(), setDoc: vi.fn(),
}));
const { finalizeDay, recordRepayment, updateDay } = await import('../lib/roomRepo');
const historyPath = 'rooms/test/history/save-1';
const currentPath = 'rooms/test/state/currentDay';
function day(): DayRecord {
  const settlement = Object.fromEntries([['a', -10000], ['b', 10000]].map(([id, amount]) => [id, { gamesTotal: amount, chipCount: 0, chipValue: 0, tableFeeShare: 0, totalWithoutFee: amount, totalWithFee: amount }]));
  return { id: 'save-1', date: '2026-11-28', games: [{ id: 'hand', scores: [] }], tableFee: 0, chips: { a: 0, b: 0 }, chipRate: 200, settlement, payment: { version: 1, cash: { a: { paid: 0, received: 0 }, b: { paid: 0, received: 0 } }, names: { a: 'A', b: 'B' }, repayments: [] } } as DayRecord;
}
const repayment: Repayment = { id: 'repay-1', from: 'a', to: 'b', amount: 6000, recordedAt: '2026-11-28T00:00:00Z' };
beforeEach(() => {
  mocks.records.clear(); mocks.writes = []; mocks.fail = false; vi.clearAllMocks();
  mocks.runTransaction.mockImplementation(async (_db, work) => {
    const pending: { path: string; data: unknown }[] = [];
    const write = (ref: { path: string }, value: unknown) => pending.push({ path: ref.path, data: value });
    await work({ get: async (ref: { path: string }) => ({ exists: () => mocks.records.has(ref.path), data: () => structuredClone(mocks.records.get(ref.path)) }), set: write, update: write });
    if (mocks.fail) throw new Error('offline');
    pending.forEach(item => { mocks.records.set(item.path, { ...(mocks.records.get(item.path) as object), ...(item.data as object) }); mocks.writes.push(item); });
  });
});

describe('payment persistence', () => {
  it('atomically finalizes cash with the result and clears the current game once, including a retry', async () => {
    const payload = day(); mocks.records.set(currentPath, { games: payload.games, session: null });
    mocks.fail = true;
    await expect(finalizeDay('test', payload, 'save-1')).rejects.toThrow('offline');
    expect(mocks.records.has(historyPath)).toBe(false);
    expect(mocks.records.get(currentPath)).toMatchObject({ games: payload.games });
    mocks.fail = false;
    await finalizeDay('test', payload, 'save-1');
    expect(mocks.records.get(currentPath)).toEqual({ games: [], session: null });
    expect(mocks.records.get(historyPath)).toMatchObject({ settlement: payload.settlement, payment: payload.payment });
    const writes = mocks.writes.length;
    const reordered = JSON.parse(JSON.stringify(payload, (_key, value) => value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).reverse()) : value));
    await finalizeDay('test', { ...reordered, date: '2026-11-29' }, 'save-1');
    expect(mocks.writes).toHaveLength(writes);
    await expect(finalizeDay('test', { ...payload, tableFee: 100 }, 'save-1')).rejects.toThrow('保存済み');
  });
  it('does not erase a newer current game or session during finalization', async () => {
    mocks.records.set(currentPath, { games: [...day().games, { id: 'new', scores: [] }], session: null });
    await expect(finalizeDay('test', day(), 'save-1')).rejects.toThrow('更新されています');
    expect(mocks.writes).toHaveLength(0);
  });
  it('reads current debt inside a transaction and prevents duplicate or excessive repayments', async () => {
    mocks.records.set(historyPath, day());
    await recordRepayment('test', 'save-1', repayment);
    const reordered = { recordedAt: repayment.recordedAt, amount: repayment.amount, to: repayment.to, from: repayment.from, id: repayment.id };
    await recordRepayment('test', 'save-1', reordered);
    expect((mocks.records.get(historyPath) as DayRecord).payment!.repayments).toHaveLength(1);
    await expect(recordRepayment('test', 'save-1', { ...repayment, id: 'repay-2', amount: 5000 })).rejects.toThrow('返済');
    expect((mocks.records.get(historyPath) as DayRecord).settlement).toEqual(day().settlement);
  });
  it('keeps payment data when editing a note, but rejects a stale payment editor', async () => {
    const initial = day(); mocks.records.set(historyPath, initial);
    await recordRepayment('test', 'save-1', repayment);
    const { payment: _payment, ...notePatch } = initial;
    await updateDay('test', 'save-1', { ...notePatch, games: [{ ...initial.games[0], note: 'メモ' }] });
    expect((mocks.records.get(historyPath) as DayRecord).payment!.repayments).toHaveLength(1);
    await expect(updateDay('test', 'save-1', initial)).rejects.toThrow('更新されています');
    expect((mocks.records.get(historyPath) as DayRecord).games[0].note).toBe('メモ');
  });
  it('rechecks the latest balance when overlapping repayments cause a transaction retry', async () => {
    mocks.records.set(historyPath, day());
    let revision = 0, firstReads = 0, attempts = 0;
    let release!: () => void;
    const bothHaveRead = new Promise<void>(resolve => { release = resolve; });
    mocks.runTransaction.mockImplementation(async (_db, work) => {
      for (;;) {
        attempts++;
        const readRevision = revision;
        let pending: { path: string; data: unknown } | undefined;
        await work({
          get: async (ref: { path: string }) => {
            const snapshot = structuredClone(mocks.records.get(ref.path));
            if (readRevision === 0) {
              firstReads++; if (firstReads === 2) release();
              await bothHaveRead;
            }
            return { exists: () => snapshot !== undefined, data: () => snapshot };
          },
          update: (ref: { path: string }, data: unknown) => { pending = { path: ref.path, data }; },
        });
        if (revision !== readRevision) continue;
        if (pending) mocks.records.set(pending.path, { ...(mocks.records.get(pending.path) as object), ...(pending.data as object) });
        revision++; return;
      }
    });
    const results = await Promise.allSettled([
      recordRepayment('test', 'save-1', repayment),
      recordRepayment('test', 'save-1', { ...repayment, id: 'repay-2' }),
    ]);
    expect(results.map(result => result.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(attempts).toBe(3);
    const saved = mocks.records.get(historyPath) as DayRecord;
    expect(saved.payment!.repayments).toHaveLength(1);
    expect(calculatePaymentPlan(saved.settlement, saved.payment!)).toMatchObject({ ok: true, outstanding: 4000 });
  });
});
