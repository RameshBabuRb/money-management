import { useState } from 'react';
import { Field } from '@/components/Field';
import { methodName, PAYMENT_METHODS } from '@/domain/constants';
import { suggestionsFrom } from '@/domain/selectors';
import type { Expense, ExpenseDraft, PaymentMethod } from '@/domain/types';
import { todayIso } from '@/lib/dates';
import { amountToInput, parseAmount } from '@/lib/money';
import { useStore } from '@/store/StoreContext';

interface ExpenseFormProps {
  /** Present when editing; absent when adding. */
  editing: Expense | null;
  onSaved: (draft: ExpenseDraft) => void;
  onCancelEdit: () => void;
}

interface Values {
  amount: string;
  note: string;
  date: string;
  method: PaymentMethod;
}

function valuesFor(expense: Expense | null): Values {
  if (!expense) return { amount: '', note: '', date: todayIso(), method: 'gpay' };
  return {
    amount: amountToInput(expense.amount),
    note: expense.note,
    date: expense.date,
    method: expense.method,
  };
}

export function ExpenseForm({ editing, onSaved, onCancelEdit }: ExpenseFormProps) {
  const { data, dispatch } = useStore();
  // Keyed by id in the parent, so remounting resets the fields on edit.
  const [values, setValues] = useState<Values>(() => valuesFor(editing));
  const [error, setError] = useState('');

  const set = (patch: Partial<Values>) => setValues((current) => ({ ...current, ...patch }));
  const suggestions = suggestionsFrom(data.expenses, (item: Expense) => item.note);

  function submit(event: React.FormEvent) {
    event.preventDefault();

    const amount = parseAmount(values.amount);
    if (amount === null || amount <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }

    setError('');
    const draft: ExpenseDraft = {
      amount,
      note: values.note.trim(),
      date: values.date || todayIso(),
      method: values.method,
    };

    if (editing) dispatch({ type: 'expense/updated', id: editing.id, draft });
    else dispatch({ type: 'expense/added', draft });

    onSaved(draft);
    if (!editing) set({ amount: '', note: '' });
  }

  return (
    <form className={`card${editing ? ' editing' : ''}`} onSubmit={submit} noValidate>
      <h2>{editing ? 'Edit expense' : 'Add an expense'}</h2>

      <Field label="Amount" htmlFor="amount">
        <input
          id="amount"
          className="input input--amount"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={values.amount}
          onChange={(event) => set({ amount: event.target.value })}
        />
      </Field>

      <Field label="What was it for?" htmlFor="note">
        <input
          id="note"
          className="input input--amount"
          list="note-options"
          autoComplete="off"
          placeholder="Type"
          value={values.note}
          onChange={(event) => set({ note: event.target.value })}
        />
        <datalist id="note-options">
          {suggestions.map((note) => (
            <option key={note} value={note} />
          ))}
        </datalist>
      </Field>

      <Field label="Date" htmlFor="date">
        <input
          id="date"
          className="input"
          type="date"
          value={values.date}
          onChange={(event) => set({ date: event.target.value })}
        />
      </Field>

      <Field label="Paid with">
        <div className="methods" role="radiogroup" aria-label="Paid with">
          {PAYMENT_METHODS.map((method) => (
            <span key={method} style={{ display: 'contents' }}>
              <input
                type="radio"
                name="method"
                id={`m-${method}`}
                value={method}
                checked={values.method === method}
                onChange={() => set({ method })}
              />
              <label htmlFor={`m-${method}`}>{methodName(method, data.cardNames)}</label>
            </span>
          ))}
        </div>
      </Field>

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button className="btn" type="submit">
          {editing ? 'Save changes' : 'Add expense'}
        </button>
        {editing && (
          <button className="btn btn--quiet" type="button" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
