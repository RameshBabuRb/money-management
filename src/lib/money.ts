import type { Paise } from '@/domain/types';

const RUPEE = '\u20B9';
const MINUS = '\u2212'; // a real minus sign, which lines up with digits

const WHOLE = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const EXACT = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Whatever was typed, as paise. Null when there is no number in it. */
export function parseAmount(input: string): Paise | null {
  const cleaned = input.replace(/[^\d.]/g, '');
  if (cleaned === '' || cleaned === '.') return null;
  const rupees = Number.parseFloat(cleaned);
  if (!Number.isFinite(rupees)) return null;
  return Math.round(rupees * 100);
}

/** Paise back into something editable in a text field. */
export function amountToInput(paise: Paise): string {
  if (!paise) return '';
  return paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2);
}

/** 124050 becomes "₹1,240.50"; whole rupees drop the decimals. */
export function formatMoney(paise: Paise | null | undefined): string {
  const value = paise ?? 0;
  const size = Math.abs(value);
  const body = size % 100 === 0 ? WHOLE.format(size / 100) : EXACT.format(size / 100);
  return `${value < 0 ? MINUS : ''}${RUPEE}${body}`;
}

/** Plain number for spreadsheets: 124050 becomes "1240.50". */
export function toRupeeString(paise: Paise): string {
  return (paise / 100).toFixed(2);
}
