import type { CardKey, LoanKind, PaymentMethod } from './types';

export const CARD_KEYS: CardKey[] = ['card1', 'card2', 'card3'];
export const PAYMENT_METHODS: PaymentMethod[] = ['gpay', 'card1', 'card2', 'card3'];

export const DEFAULT_CARD_NAMES: Record<CardKey, string> = {
  card1: 'Card 1',
  card2: 'Card 2',
  card3: 'Card 3',
};

/**
 * One running number per person covers all four movements: plus means they
 * owe you, minus means you owe them. A part repayment then needs no special
 * handling.
 */
export const LOAN_KINDS: { id: LoanKind; label: string; sign: 1 | -1 }[] = [
  { id: 'gave', label: 'I gave', sign: 1 },
  { id: 'got', label: 'Got back', sign: -1 },
  { id: 'borrowed', label: 'I borrowed', sign: -1 },
  { id: 'repaid', label: 'I repaid', sign: 1 },
];

const KIND_BY_ID = new Map(LOAN_KINDS.map((kind) => [kind.id, kind]));

export function loanKind(id: LoanKind) {
  return KIND_BY_ID.get(id) ?? LOAN_KINDS[0]!;
}

/** Money arriving should not be labelled "Paid with". */
export function sourceLabel(kind: LoanKind): string {
  return kind === 'got' || kind === 'borrowed' ? 'Received in' : 'Paid with';
}

export function methodName(method: PaymentMethod | undefined, names: Record<CardKey, string>): string {
  if (!method) return '';
  return method === 'gpay' ? 'GPay' : names[method];
}
