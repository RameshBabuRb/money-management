import { useState } from 'react';
import { Field } from '@/components/Field';
import { TrashIcon } from '@/components/Icons';
import { Money } from '@/components/Money';
import { Tabs } from '@/components/Tabs';
import {
  loanKind,
  LOAN_KINDS,
  methodName,
  PAYMENT_METHODS,
  sourceLabel,
} from '@/domain/constants';
import {
  bySettlementThenSize,
  owedByMe,
  owedToMe,
  peopleBalances,
  suggestionsFrom,
} from '@/domain/selectors';
import type { Loan, LoanKind, MonthKey, PaymentMethod } from '@/domain/types';
import { newestFirst, shortDate, todayIso } from '@/lib/dates';
import { parseAmount } from '@/lib/money';
import { useStore } from '@/store/StoreContext';
import { usePersistentChoice } from '@/hooks/usePersistentChoice';

type SubTab = 'amount' | 'owes';
type Scope = 'month' | 'all';

const SUB_TABS = [
  { id: 'amount' as const, label: 'Amount' },
  { id: 'owes' as const, label: 'Who owes what' },
];

interface FriendsPanelProps {
  month: MonthKey;
  onMonthChange: (month: MonthKey) => void;
  onDelete: (loan: Loan) => void;
}

export function FriendsPanel({ month, onMonthChange, onDelete }: FriendsPanelProps) {
  const { data } = useStore();
  const [sub, setSub] = usePersistentChoice<SubTab>(
    'simple-money/friendstab',
    ['amount', 'owes'],
    'amount',
  );
  const [scope, setScope] = usePersistentChoice<Scope>(
    'simple-money/loanscope',
    ['month', 'all'],
    'month',
  );

  // Balances are always all-time; the scope only decides who is listed and
  // which entries show underneath them.
  const people = peopleBalances(data.loans, scope === 'month' ? month : null);
  const visible = people.filter((person) => person.inScope).sort(bySettlementThenSize);

  return (
    <div className="panel">
      <div className="tiles">
        <div className="tile">
          <span>They owe me</span>
          <strong>
            <Money value={owedToMe(people)} tone={owedToMe(people) ? 'positive' : 'neutral'} />
          </strong>
        </div>
        <div className="tile">
          <span>I owe them</span>
          <strong>
            <Money value={owedByMe(people)} tone={owedByMe(people) ? 'negative' : 'neutral'} />
          </strong>
        </div>
      </div>

      <Tabs
        tabs={SUB_TABS}
        current={sub}
        onChange={setSub}
        ariaLabel="Friends views"
        variant="segment"
      />

      {sub === 'amount' ? (
        <LoanForm onSaved={(date) => onMonthChange(date.slice(0, 7))} />
      ) : (
        <section className="card">
          <div className="card__head">
            <h2>Who owes what</h2>
            <div className="scope" role="group" aria-label="Which entries to show">
              <button type="button" aria-pressed={scope === 'month'} onClick={() => setScope('month')}>
                This month
              </button>
              <button type="button" aria-pressed={scope === 'all'} onClick={() => setScope('all')}>
                All time
              </button>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="empty">
              {data.loans.length === 0
                ? 'Nothing recorded with friends yet.'
                : 'Nothing with friends in this month. Tap All time to see everyone.'}
            </p>
          ) : (
            visible.map((person) => (
              <details className="person" key={person.name.toLowerCase()}>
                <summary>
                  <span>
                    <span className="person__name">{person.name}</span>
                    <span className="person__state">
                      {person.balance > 0 ? 'owes me' : person.balance < 0 ? 'I owe' : 'all settled'}
                    </span>
                  </span>
                  <span className="person__amount">
                    <Money value={Math.abs(person.balance)} tone={person.balance > 0 ? 'positive' : person.balance < 0 ? 'negative' : 'neutral'} />
                  </span>
                </summary>
                <div className="person__body">
                  {[...person.entries].sort(newestFirst).map((loan) => (
                    <div className="row" key={loan.id}>
                      <div className="row__main">
                        <span className="row__title">{loanKind(loan.kind).label}</span>
                        <span className="row__meta">
                          {shortDate(loan.date)}
                          {loan.method ? ` \u00B7 ${methodName(loan.method, data.cardNames)}` : ''}
                        </span>
                      </div>
                      <span className="row__amount">
                        <Money value={loan.amount} />
                      </span>
                      <button
                        type="button"
                        className="row__btn"
                        aria-label={`Delete this entry for ${person.name}`}
                        onClick={() => onDelete(loan)}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                </div>
              </details>
            ))
          )}
        </section>
      )}

      <p className="empty">
        This never counts as an expense, so your month total stays clean. Balances here are
        all-time, not month by month.
      </p>
    </div>
  );
}

function LoanForm({ onSaved }: { onSaved: (date: string) => void }) {
  const { data, dispatch } = useStore();
  const [amount, setAmount] = useState('');
  const [person, setPerson] = useState('');
  const [date, setDate] = useState(todayIso);
  const [kind, setKind] = useState<LoanKind>('gave');
  const [method, setMethod] = useState<PaymentMethod>('gpay');
  const [error, setError] = useState('');

  const names = suggestionsFrom(data.loans, (loan: Loan) => loan.person);

  function submit(event: React.FormEvent) {
    event.preventDefault();

    const paise = parseAmount(amount);
    if (paise === null || paise <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (!person.trim()) {
      setError('Whose money is it?');
      return;
    }

    setError('');
    const when = date || todayIso();
    dispatch({
      type: 'loan/added',
      draft: { amount: paise, person: person.trim(), date: when, kind, method },
    });

    setAmount('');
    setPerson('');
    onSaved(when);
  }

  return (
    <form className="card" onSubmit={submit} noValidate>
      <h2>Money with a friend</h2>

      <Field label="Amount" htmlFor="loan-amount">
        <input
          id="loan-amount"
          className="input input--amount"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </Field>

      <Field label="Who?" htmlFor="loan-person">
        <input
          id="loan-person"
          className="input input--amount"
          list="person-options"
          autoComplete="off"
          placeholder="Name"
          value={person}
          onChange={(event) => setPerson(event.target.value)}
        />
        <datalist id="person-options">
          {names.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </Field>

      <Field label="Date" htmlFor="loan-date">
        <input
          id="loan-date"
          className="input"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </Field>

      <Field label="What happened">
        <div className="methods" role="radiogroup" aria-label="What happened">
          {LOAN_KINDS.map((option) => (
            <span key={option.id} style={{ display: 'contents' }}>
              <input
                type="radio"
                name="loan-kind"
                id={`k-${option.id}`}
                checked={kind === option.id}
                onChange={() => setKind(option.id)}
              />
              <label htmlFor={`k-${option.id}`}>{option.label}</label>
            </span>
          ))}
        </div>
      </Field>

      <Field label={sourceLabel(kind)}>
        <div className="methods" role="radiogroup" aria-label={sourceLabel(kind)}>
          {PAYMENT_METHODS.map((option) => (
            <span key={option} style={{ display: 'contents' }}>
              <input
                type="radio"
                name="loan-method"
                id={`lm-${option}`}
                checked={method === option}
                onChange={() => setMethod(option)}
              />
              <label htmlFor={`lm-${option}`}>{methodName(option, data.cardNames)}</label>
            </span>
          ))}
        </div>
      </Field>

      {error && <p className="error">{error}</p>}
      <button className="btn" type="submit">
        Save
      </button>
    </form>
  );
}
