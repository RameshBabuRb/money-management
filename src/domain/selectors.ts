import { monthOf } from '@/lib/dates';
import { loanKind, PAYMENT_METHODS } from './constants';
import type {
  AppData,
  Expense,
  Loan,
  MonthKey,
  Paise,
  PaymentMethod,
} from './types';

export function inMonth(dated: { date: string }, month: MonthKey): boolean {
  return monthOf(dated.date) === month;
}

export function sumAmounts(items: readonly { amount: Paise }[]): Paise {
  return items.reduce((total, item) => total + item.amount, 0);
}

/** Spend per payment method for one month, every method present even at zero. */
export function totalsByMethod(
  expenses: readonly Expense[],
  month: MonthKey,
): Record<PaymentMethod, Paise> {
  const totals = Object.fromEntries(
    PAYMENT_METHODS.map((method) => [method, 0]),
  ) as Record<PaymentMethod, Paise>;

  for (const expense of expenses) {
    if (inMonth(expense, month)) totals[expense.method] += expense.amount;
  }
  return totals;
}

export interface SpendSlice {
  label: string;
  amount: Paise;
}

/**
 * Spend grouped by what it was for, biggest first. Notes match
 * case-insensitively, keeping the first spelling seen, and everything past
 * the top `limit` folds into one "Other" slice so the chart stays readable.
 */
export function spendByNote(expenses: readonly Expense[], limit = 4): SpendSlice[] {
  const byKey = new Map<string, SpendSlice>();

  for (const expense of expenses) {
    const label = expense.note.trim() || 'Expense';
    const key = label.toLowerCase();
    const slice = byKey.get(key);
    if (slice) slice.amount += expense.amount;
    else byKey.set(key, { label, amount: expense.amount });
  }

  const sorted = [...byKey.values()]
    .filter((slice) => slice.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  if (sorted.length <= limit + 1) return sorted;

  const rest = sorted.slice(limit);
  return [...sorted.slice(0, limit), { label: 'Other', amount: sumAmounts(rest) }];
}

export interface PersonBalance {
  /** The spelling first used; later entries match on it case-insensitively. */
  name: string;
  /** Positive: they owe you. Negative: you owe them. Always all-time. */
  balance: Paise;
  /** Only the entries in scope, newest first. */
  entries: Loan[];
  /** Whether anything of theirs falls inside the current scope. */
  inScope: boolean;
}

/**
 * Balances always come from every entry ever recorded, even when the list is
 * filtered to a month. A loan from August is still owed in November, and a
 * number that moved with the month picker would be worse than useless.
 */
export function peopleBalances(loans: readonly Loan[], month: MonthKey | null): PersonBalance[] {
  const byKey = new Map<string, PersonBalance>();

  for (const loan of loans) {
    const key = loan.person.toLowerCase();
    let person = byKey.get(key);
    if (!person) {
      person = { name: loan.person, balance: 0, entries: [], inScope: false };
      byKey.set(key, person);
    }

    person.balance += loanKind(loan.kind).sign * loan.amount;

    if (month === null || inMonth(loan, month)) {
      person.entries.push(loan);
      person.inScope = true;
    }
  }

  return [...byKey.values()];
}

export function owedToMe(people: readonly PersonBalance[]): Paise {
  return people.reduce((total, person) => total + Math.max(person.balance, 0), 0);
}

export function owedByMe(people: readonly PersonBalance[]): Paise {
  return people.reduce((total, person) => total + Math.max(-person.balance, 0), 0);
}

/** Anyone still settling up floats above the people who are square. */
export function bySettlementThenSize(a: PersonBalance, b: PersonBalance): number {
  const live = Number(b.balance !== 0) - Number(a.balance !== 0);
  if (live !== 0) return live;
  return Math.abs(b.balance) - Math.abs(a.balance);
}

/**
 * Past entries, newest first and deduped case-insensitively, for the
 * type-or-pick fields. Starts empty and fills itself in as months go by.
 */
export function suggestionsFrom(
  items: readonly { createdAt: number }[],
  pick: (item: never) => string,
  limit = 40,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  [...items]
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach((item) => {
      const value = pick(item as never).trim();
      if (!value) return;
      const key = value.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(value);
    });

  return out.slice(0, limit);
}

export function expensesForMonth(data: AppData, month: MonthKey): Expense[] {
  return data.expenses.filter((expense) => inMonth(expense, month));
}
