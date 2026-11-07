import { useCallback, useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Confirmation } from '@/components/ConfirmDialog';
import { Money } from '@/components/Money';
import { SpendPie } from '@/components/SpendPie';
import { Tabs } from '@/components/Tabs';
import { loanKind, methodName } from '@/domain/constants';
import { expensesForMonth, spendByNote, sumAmounts } from '@/domain/selectors';
import type { Expense, Loan, MonthKey } from '@/domain/types';
import { monthOf, shiftMonth, shortDate, todayIso } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { BackupPanel } from '@/features/BackupPanel';
import { CardsPanel } from '@/features/CardsPanel';
import { ExpenseForm } from '@/features/ExpenseForm';
import { ExpenseList } from '@/features/ExpenseList';
import { FriendsPanel } from '@/features/FriendsPanel';
import { usePersistentChoice } from '@/hooks/usePersistentChoice';
import { useStore } from '@/store/StoreContext';

type TabId = 'current' | 'month' | 'cards' | 'friends';

const TABS = [
  { id: 'current' as const, label: 'Current expense' },
  { id: 'month' as const, label: 'This month' },
  { id: 'cards' as const, label: 'Card details' },
  { id: 'friends' as const, label: 'Friends' },
];

export function App() {
  const { data, dispatch } = useStore();
  const [month, setMonth] = useState<MonthKey>(() => monthOf(todayIso()));
  const [tab, setTab] = usePersistentChoice<TabId>(
    'simple-money/tab',
    ['current', 'month', 'cards', 'friends'],
    'current',
  );
  const [editing, setEditing] = useState<Expense | null>(null);
  const [tabBeforeEdit, setTabBeforeEdit] = useState<TabId | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const closeConfirmation = useCallback(() => setConfirmation(null), []);

  const monthExpenses = expensesForMonth(data, month);
  // Today is always actual today, never the month being browsed: a tab
  // called "current" should answer what you have spent so far.
  const today = todayIso();
  const todayExpenses = data.expenses.filter((expense) => expense.date === today);

  function startEdit(expense: Expense) {
    setEditing(expense);
    setTabBeforeEdit(tab);
    setTab('current');
  }

  function finishEdit() {
    setEditing(null);
    if (tabBeforeEdit) setTab(tabBeforeEdit);
    setTabBeforeEdit(null);
  }

  function askDeleteExpense(expense: Expense) {
    setConfirmation({
      title: 'Delete this entry?',
      body: `${expense.note || 'Expense'} \u00B7 ${formatMoney(expense.amount)} \u00B7 ${shortDate(expense.date)} \u00B7 ${methodName(expense.method, data.cardNames)}`,
      confirmLabel: 'Delete',
      cancelLabel: 'Keep it',
      onConfirm: () => {
        if (editing?.id === expense.id) setEditing(null);
        dispatch({ type: 'expense/removed', id: expense.id });
      },
    });
  }

  function askDeleteLoan(loan: Loan) {
    setConfirmation({
      title: 'Delete this entry?',
      body: `${loanKind(loan.kind).label} \u00B7 ${loan.person} \u00B7 ${formatMoney(loan.amount)} \u00B7 ${shortDate(loan.date)}`,
      confirmLabel: 'Delete',
      cancelLabel: 'Keep it',
      onConfirm: () => dispatch({ type: 'loan/removed', id: loan.id }),
    });
  }

  return (
    <div className="wrap">
      <div className="topbar">
        <h1>Money</h1>
        <div className="monthbar">
          <button
            type="button"
            className="step"
            aria-label="Previous month"
            onClick={() => setMonth(shiftMonth(month, -1))}
          >
            &#8249;
          </button>
          <input
            type="month"
            id="month"
            aria-label="Month to show"
            value={month}
            onChange={(event) => setMonth(event.target.value || monthOf(todayIso()))}
          />
          <button
            type="button"
            className="step"
            aria-label="Next month"
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            &#8250;
          </button>
        </div>
      </div>

      <section className="total">
        <p className="total__label">Total spent</p>
        <p className="total__figure">
          <Money value={sumAmounts(monthExpenses)} />
        </p>
        <p className="total__sub">
          {monthExpenses.length === 0
            ? 'Nothing recorded yet'
            : `${monthExpenses.length} ${monthExpenses.length === 1 ? 'expense' : 'expenses'}`}
        </p>
      </section>

      <Tabs tabs={TABS} current={tab} onChange={setTab} ariaLabel="Views" />

      {tab === 'current' && (
        <div className="panel">
          <ExpenseForm
            // Remounting on the edited id resets the fields cleanly.
            key={editing?.id ?? 'new'}
            editing={editing}
            onSaved={(draft) => {
              // Follow the entry to its month, so it is never saved out of sight.
              setMonth(monthOf(draft.date));
              if (editing) finishEdit();
            }}
            onCancelEdit={finishEdit}
          />

          <section className="card">
            <div className="card__head">
              <h2>Today</h2>
              <strong>
                <Money value={sumAmounts(todayExpenses)} />
              </strong>
            </div>
            <ExpenseList
              expenses={todayExpenses}
              emptyText="Nothing spent today yet."
              onEdit={startEdit}
              onDelete={askDeleteExpense}
            />
          </section>
        </div>
      )}

      {tab === 'month' && (
        <div className="panel">
          {monthExpenses.length > 0 && (
            <section className="card">
              <h2>Where it went</h2>
              <SpendPie slices={spendByNote(monthExpenses)} />
            </section>
          )}

          <section className="card">
            <h2>Everything this month</h2>
            <ExpenseList
              expenses={monthExpenses}
              emptyText="No expenses this month."
              onEdit={startEdit}
              onDelete={askDeleteExpense}
            />
          </section>
        </div>
      )}

      {tab === 'cards' && <CardsPanel month={month} />}

      {tab === 'friends' && (
        <FriendsPanel month={month} onMonthChange={setMonth} onDelete={askDeleteLoan} />
      )}

      <BackupPanel ask={setConfirmation} />

      <p className="foot">Saved in this browser only. Clearing site data clears your expenses.</p>

      <ConfirmDialog request={confirmation} onClose={closeConfirmation} />
    </div>
  );
}
