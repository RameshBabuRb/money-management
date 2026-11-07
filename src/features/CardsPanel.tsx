import { CARD_KEYS, DEFAULT_CARD_NAMES, methodName, PAYMENT_METHODS } from '@/domain/constants';
import { totalsByMethod } from '@/domain/selectors';
import { Money } from '@/components/Money';
import { Field } from '@/components/Field';
import type { MonthKey } from '@/domain/types';
import { useStore } from '@/store/StoreContext';

export function CardsPanel({ month }: { month: MonthKey }) {
  const { data, dispatch } = useStore();
  const totals = totalsByMethod(data.expenses, month);

  return (
    <div className="panel">
      <div className="tiles">
        {PAYMENT_METHODS.map((method) => (
          <div className="tile" key={method}>
            <span>{methodName(method, data.cardNames)}</span>
            <strong>
              <Money value={totals[method]} />
            </strong>
          </div>
        ))}
      </div>

      <p className="empty">Totals for the month shown above.</p>

      <details>
        <summary>Card names</summary>
        {CARD_KEYS.map((key, index) => (
          <Field key={key} label={['First card', 'Second card', 'Third card'][index]!} htmlFor={`name-${key}`}>
            <input
              id={`name-${key}`}
              className="input"
              autoComplete="off"
              placeholder={DEFAULT_CARD_NAMES[key]}
              value={data.cardNames[key] === DEFAULT_CARD_NAMES[key] ? '' : data.cardNames[key]}
              onChange={(event) =>
                dispatch({ type: 'cardName/changed', key, name: event.target.value })
              }
            />
          </Field>
        ))}
      </details>
    </div>
  );
}
