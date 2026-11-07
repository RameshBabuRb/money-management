import { describe, expect, it } from 'vitest';
import { amountToInput, formatMoney, parseAmount, toRupeeString } from './money';

describe('parseAmount', () => {
  it('reads rupees as paise', () => {
    expect(parseAmount('1240')).toBe(124000);
    expect(parseAmount('1240.50')).toBe(124050);
  });

  it('tolerates the symbol, spaces and grouping commas', () => {
    expect(parseAmount(' ₹1,240.50 ')).toBe(124050);
  });

  it('rounds rather than leaving a fraction of a paisa', () => {
    expect(parseAmount('0.005')).toBe(1);
  });

  it('returns null when there is no number', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('.')).toBeNull();
  });
});

describe('formatMoney', () => {
  it('groups the Indian way and drops empty decimals', () => {
    expect(formatMoney(10000000)).toBe('₹1,00,000');
    expect(formatMoney(124000)).toBe('₹1,240');
    expect(formatMoney(124050)).toBe('₹1,240.50');
  });

  it('uses a real minus sign so columns stay aligned', () => {
    expect(formatMoney(-200000)).toBe('−₹2,000');
  });
});

describe('round trips', () => {
  it('survives input and back', () => {
    expect(parseAmount(amountToInput(124050))).toBe(124050);
    expect(parseAmount(amountToInput(124000))).toBe(124000);
  });

  it('writes a plain number for spreadsheets', () => {
    expect(toRupeeString(124050)).toBe('1240.50');
  });
});
