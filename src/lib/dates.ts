import type { IsoDate, MonthKey } from '@/domain/types';

const SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const;

/**
 * Today in the user's own timezone. Plain `toISOString()` is UTC, which
 * files an evening purchase in India under the wrong day.
 */
export function todayIso(now: Date = new Date()): IsoDate {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function monthOf(date: IsoDate): MonthKey {
  return date.slice(0, 7);
}

export function shiftMonth(month: MonthKey, delta: number): MonthKey {
  const [year, index] = month.split('-').map(Number) as [number, number];
  const shifted = new Date(year, index - 1 + delta, 1);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}`;
}

/** `2026-11-05` becomes `5 Nov`. */
export function shortDate(date: IsoDate): string {
  const [, month, day] = date.split('-').map(Number) as [number, number, number];
  return `${day} ${SHORT[month - 1]}`;
}

interface Dated {
  date: IsoDate;
  createdAt: number;
}

/** Newest first, with entry order breaking ties inside a day. */
export function newestFirst(a: Dated, b: Dated): number {
  if (a.date === b.date) return b.createdAt - a.createdAt;
  return a.date < b.date ? 1 : -1;
}
