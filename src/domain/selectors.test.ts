import { describe, expect, it } from 'vitest';
import { bySettlementThenSize, owedByMe, owedToMe, peopleBalances, spendByNote, totalsByMethod } from './selectors';
import type { Expense, Loan } from './types';

const expense = (over: Partial<Expense>): Expense => ({
  id: Math.random().toString(36).slice(2),
  amount: 10000,
  note: '',
  date: '2026-11-05',
  method: 'gpay',
  createdAt: 1,
  ...over,
});

const loan = (over: Partial<Loan>): Loan => ({
  id: Math.random().toString(36).slice(2),
  amount: 10000,
  person: 'Arun',
  date: '2026-11-05',
  kind: 'gave',
  createdAt: 1,
  ...over,
});

describe('totalsByMethod', () => {
  it('splits a month by payment method and keeps the zeroes', () => {
    const totals = totalsByMethod(
      [
        expense({ amount: 120000, method: 'card3' }),
        expense({ amount: 45000, method: 'gpay' }),
        expense({ amount: 99900, method: 'gpay', date: '2026-10-30' }),
      ],
      '2026-11',
    );

    expect(totals.card3).toBe(120000);
    expect(totals.gpay).toBe(45000);
    expect(totals.card1).toBe(0);
  });
});

describe('spendByNote', () => {
  it('groups notes case-insensitively, biggest first', () => {
    const slices = spendByNote([
      expense({ amount: 30000, note: 'Fuel' }),
      expense({ amount: 20000, note: 'fuel ' }),
      expense({ amount: 80000, note: 'Rent' }),
    ]);

    expect(slices).toEqual([
      { label: 'Rent', amount: 80000 },
      { label: 'Fuel', amount: 50000 },
    ]);
  });

  it('folds everything past the top few into Other', () => {
    const slices = spendByNote(
      ['A', 'B', 'C', 'D'].map((note, index) => expense({ note, amount: (4 - index) * 1000 })),
      2,
    );

    expect(slices.map((slice) => slice.label)).toEqual(['A', 'B', 'Other']);
    expect(slices[2]!.amount).toBe(3000);
  });
});

describe('peopleBalances', () => {
  const loans = [
    loan({ person: 'Arun', kind: 'gave', amount: 500000, date: '2026-10-10' }),
    loan({ person: 'arun', kind: 'got', amount: 200000, date: '2026-11-18' }),
    loan({ person: 'Karthik', kind: 'borrowed', amount: 300000, date: '2026-11-12' }),
    loan({ person: 'Karthik', kind: 'repaid', amount: 100000, date: '2026-11-20' }),
  ];

  it('nets a part repayment into one number', () => {
    const arun = peopleBalances(loans, null).find((p) => p.name === 'Arun');
    expect(arun?.balance).toBe(300000);
  });

  it('treats borrowing as the other direction', () => {
    const karthik = peopleBalances(loans, null).find((p) => p.name === 'Karthik');
    expect(karthik?.balance).toBe(-200000);
  });

  it('merges the same name whatever the casing', () => {
    expect(peopleBalances(loans, null)).toHaveLength(2);
  });

  it('splits into receivable and payable', () => {
    const people = peopleBalances(loans, null);
    expect(owedToMe(people)).toBe(300000);
    expect(owedByMe(people)).toBe(200000);
  });

  it('keeps balances all-time even when the list is filtered to a month', () => {
    // Arun's loan was given in October; in November he still owes the same.
    const november = peopleBalances(loans, '2026-11');
    const arun = november.find((p) => p.name === 'Arun');
    expect(arun?.balance).toBe(300000);
    expect(arun?.entries).toHaveLength(1);
  });

  it('marks who falls outside the month', () => {
    const october = peopleBalances(loans, '2026-10');
    expect(october.filter((p) => p.inScope).map((p) => p.name)).toEqual(['Arun']);
  });

  it('floats people still settling up above the ones who are square', () => {
    const settled = [
      loan({ person: 'Divya', kind: 'gave', amount: 100000 }),
      loan({ person: 'Divya', kind: 'got', amount: 100000 }),
      ...loans,
    ];
    const order = peopleBalances(settled, null).sort(bySettlementThenSize).map((p) => p.name);
    expect(order.at(-1)).toBe('Divya');
  });
});
