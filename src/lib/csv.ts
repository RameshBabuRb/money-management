import { loanKind, methodName } from '@/domain/constants';
import { toRupeeString } from './money';
import type { AppData } from '@/domain/types';

function cell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function toCsv(rows: string[][]): string {
  // A BOM first, so Excel opens non-English descriptions correctly.
  return '\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\n');
}

const byDate = (a: { date: string }, b: { date: string }) =>
  a.date < b.date ? -1 : a.date > b.date ? 1 : 0;

export function expensesCsv(data: AppData): string {
  const rows: string[][] = [['Date', 'Description', 'Amount (INR)', 'Paid with']];
  [...data.expenses].sort(byDate).forEach((expense) => {
    rows.push([
      expense.date,
      expense.note,
      toRupeeString(expense.amount),
      methodName(expense.method, data.cardNames),
    ]);
  });
  return toCsv(rows);
}

export function friendsCsv(data: AppData): string {
  const rows: string[][] = [
    ['Date', 'Person', 'What happened', 'Amount (INR)', 'Paid with or received in'],
  ];
  [...data.loans].sort(byDate).forEach((loan) => {
    rows.push([
      loan.date,
      loan.person,
      loanKind(loan.kind).label,
      toRupeeString(loan.amount),
      methodName(loan.method, data.cardNames),
    ]);
  });
  return toCsv(rows);
}

export function backupJson(data: AppData): string {
  return JSON.stringify(
    { app: 'simple-money', version: 1, exportedAt: new Date().toISOString(), data },
    null,
    2,
  );
}
