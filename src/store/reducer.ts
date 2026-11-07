import type { AppData, CardKey, ExpenseDraft, LoanDraft } from '@/domain/types';
import { DEFAULT_CARD_NAMES } from '@/domain/constants';

export type Action =
  | { type: 'expense/added'; draft: ExpenseDraft }
  | { type: 'expense/updated'; id: string; draft: ExpenseDraft }
  | { type: 'expense/removed'; id: string }
  | { type: 'loan/added'; draft: LoanDraft }
  | { type: 'loan/removed'; id: string }
  | { type: 'cardName/changed'; key: CardKey; name: string }
  | { type: 'data/replaced'; data: AppData };

function newId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 6);
  return `${prefix}${Date.now()}${random}`;
}

export function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'expense/added':
      return {
        ...state,
        expenses: [...state.expenses, { ...action.draft, id: newId('e'), createdAt: Date.now() }],
      };

    case 'expense/updated':
      return {
        ...state,
        expenses: state.expenses.map((expense) =>
          // Keep the id and the original entry time; only the fields change.
          expense.id === action.id ? { ...expense, ...action.draft } : expense,
        ),
      };

    case 'expense/removed':
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) };

    case 'loan/added':
      return {
        ...state,
        loans: [...state.loans, { ...action.draft, id: newId('l'), createdAt: Date.now() }],
      };

    case 'loan/removed':
      return { ...state, loans: state.loans.filter((loan) => loan.id !== action.id) };

    case 'cardName/changed':
      return {
        ...state,
        cardNames: {
          ...state.cardNames,
          [action.key]: action.name.trim() || DEFAULT_CARD_NAMES[action.key],
        },
      };

    case 'data/replaced':
      return action.data;
  }
}
