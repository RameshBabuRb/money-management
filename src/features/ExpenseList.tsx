import { Money } from '@/components/Money';
import { EditIcon, TrashIcon } from '@/components/Icons';
import { methodName } from '@/domain/constants';
import { newestFirst, shortDate } from '@/lib/dates';
import type { Expense } from '@/domain/types';
import { useStore } from '@/store/StoreContext';

interface ExpenseListProps {
  expenses: readonly Expense[];
  emptyText: string;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export function ExpenseList({ expenses, emptyText, onEdit, onDelete }: ExpenseListProps) {
  const { data } = useStore();
  const rows = [...expenses].sort(newestFirst);

  if (rows.length === 0) return <p className="empty">{emptyText}</p>;

  return (
    <ul className="list">
      {rows.map((expense) => (
        <li key={expense.id} className="row">
          <div className="row__main">
            <span className="row__title">{expense.note || 'Expense'}</span>
            <span className="row__meta">
              {shortDate(expense.date)} &middot; {methodName(expense.method, data.cardNames)}
            </span>
          </div>
          <span className="row__amount">
            <Money value={expense.amount} />
          </span>
          <button
            type="button"
            className="row__btn"
            aria-label={`Edit ${expense.note || 'expense'}`}
            onClick={() => onEdit(expense)}
          >
            <EditIcon />
          </button>
          <button
            type="button"
            className="row__btn"
            aria-label={`Delete ${expense.note || 'expense'}`}
            onClick={() => onDelete(expense)}
          >
            <TrashIcon />
          </button>
        </li>
      ))}
    </ul>
  );
}
