import { DEFAULT_CARD_NAMES } from '@/domain/constants';
import type { AppData } from '@/domain/types';

/**
 * Deliberately the same key and the same shape as the single-file HTML
 * version, so a backup exported from either one restores into the other.
 */
export const STORAGE_KEY = 'simple-money/v1';

export function emptyData(): AppData {
  return { expenses: [], loans: [], cardNames: { ...DEFAULT_CARD_NAMES } };
}

/** Anything out of storage or a backup file is untrusted: check its shape. */
export function coerceData(raw: unknown): AppData | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const value = raw as Partial<AppData>;
  if (!Array.isArray(value.expenses)) return null;

  const names = (value.cardNames ?? {}) as Partial<AppData['cardNames']>;
  return {
    expenses: value.expenses,
    // Saves from before the Friends tab existed simply have no loans.
    loans: Array.isArray(value.loans) ? value.loans : [],
    cardNames: {
      card1: names.card1 || DEFAULT_CARD_NAMES.card1,
      card2: names.card2 || DEFAULT_CARD_NAMES.card2,
      card3: names.card3 || DEFAULT_CARD_NAMES.card3,
    },
  };
}

export function loadData(): AppData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    return coerceData(JSON.parse(raw)) ?? emptyData();
  } catch (error) {
    console.warn('Could not read saved data; starting empty.', error);
    return emptyData();
  }
}

export function saveData(data: AppData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    // Private browsing or a full quota. The session still works in memory.
    console.warn('Could not save. Changes will be lost when you close the tab.', error);
  }
}
