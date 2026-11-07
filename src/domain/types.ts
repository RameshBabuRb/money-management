/** Money is integer paise throughout. ₹1,240.50 is 124050, never a float. */
export type Paise = number;

/** A calendar day, `YYYY-MM-DD`, in the user's own timezone. */
export type IsoDate = string;

/** A calendar month, `YYYY-MM`. */
export type MonthKey = string;

export type CardKey = 'card1' | 'card2' | 'card3';
export type PaymentMethod = 'gpay' | CardKey;

/** What happened between you and a friend. */
export type LoanKind = 'gave' | 'got' | 'borrowed' | 'repaid';

export interface Expense {
  id: string;
  amount: Paise;
  note: string;
  date: IsoDate;
  method: PaymentMethod;
  createdAt: number;
}

export interface Loan {
  id: string;
  amount: Paise;
  person: string;
  date: IsoDate;
  kind: LoanKind;
  /** Absent on entries saved before this field existed. */
  method?: PaymentMethod;
  createdAt: number;
}

export type CardNames = Record<CardKey, string>;

export interface AppData {
  expenses: Expense[];
  loans: Loan[];
  cardNames: CardNames;
}

export type ExpenseDraft = Omit<Expense, 'id' | 'createdAt'>;
export type LoanDraft = Omit<Loan, 'id' | 'createdAt'>;
