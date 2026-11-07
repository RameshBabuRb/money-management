import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '@/App';
import { StoreProvider } from '@/store/StoreContext';
import { todayIso } from '@/lib/dates';

function open() {
  return render(
    <StoreProvider>
      <App />
    </StoreProvider>,
  );
}

const today = todayIso();

/** The headline figure, as distinct from the same amount inside a row. */
const headline = () => document.querySelector('.total__figure')?.textContent;
const rows = () => within(document.querySelector('.list') as HTMLElement);

async function addExpense(user: ReturnType<typeof userEvent.setup>, amount: string, note: string, method: string) {
  await user.clear(screen.getByLabelText('Amount'));
  await user.type(screen.getByLabelText('Amount'), amount);
  await user.clear(screen.getByLabelText('What was it for?'));
  await user.type(screen.getByLabelText('What was it for?'), note);
  await user.click(screen.getByLabelText(method));
  await user.click(screen.getByRole('button', { name: 'Add expense' }));
}

beforeEach(() => window.localStorage.clear());

describe('the ported app', () => {
  it('adds an expense and counts it in the month total and today', async () => {
    const user = userEvent.setup();
    open();

    await addExpense(user, '1240.50', 'Groceries', 'GPay');

    expect(headline()).toBe('₹1,240.50');
    expect(screen.getByText('1 expense')).toBeInTheDocument();
    expect(rows().getByText('Groceries')).toBeInTheDocument();
  });

  it('suggests what you typed before', async () => {
    const user = userEvent.setup();
    const { container } = open();

    expect(container.querySelectorAll('#note-options option')).toHaveLength(0);
    await addExpense(user, '300', 'Fuel', 'GPay');
    expect([...container.querySelectorAll('#note-options option')].map((o) => (o as HTMLOptionElement).value))
      .toEqual(['Fuel']);
  });

  it('splits the month by payment method on the Cards tab', async () => {
    const user = userEvent.setup();
    open();

    await addExpense(user, '1200', 'Fuel', 'Card 3');
    await addExpense(user, '450', 'Tea', 'GPay');
    await user.click(screen.getByRole('tab', { name: 'Card details' }));

    const tiles = screen.getAllByText(/₹/).map((n) => n.textContent);
    expect(tiles).toContain('₹1,200');
    expect(tiles).toContain('₹450');
  });

  it('renames a card everywhere at once', async () => {
    const user = userEvent.setup();
    open();

    await user.click(screen.getByRole('tab', { name: 'Card details' }));
    await user.click(screen.getByText('Card names'));
    await user.type(screen.getByLabelText('Third card'), 'HDFC');

    await user.click(screen.getByRole('tab', { name: 'Current expense' }));
    expect(screen.getByLabelText('HDFC')).toBeInTheDocument();
  });

  it('edits an entry in place rather than adding a second one', async () => {
    const user = userEvent.setup();
    open();

    await addExpense(user, '450', 'Groceries', 'GPay');
    await user.click(screen.getByRole('tab', { name: 'This month' }));
    await user.click(screen.getByLabelText('Edit Groceries'));

    expect(screen.getByRole('heading', { name: 'Edit expense' })).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toHaveValue('450');

    await user.clear(screen.getByLabelText('Amount'));
    await user.type(screen.getByLabelText('Amount'), '525');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.getByText('1 expense')).toBeInTheDocument();
    expect(headline()).toBe('₹525');
    // Editing from the month list returns you to the month list.
    expect(screen.getByRole('tab', { name: 'This month' })).toHaveAttribute('aria-selected', 'true');
  });

  it('asks before deleting and respects a no', async () => {
    const user = userEvent.setup();
    open();
    await addExpense(user, '450', 'Groceries', 'GPay');

    await user.click(screen.getByLabelText('Delete Groceries'));
    expect(screen.getByText('Delete this entry?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Keep it' }));
    expect(screen.getByText('Groceries')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Delete Groceries'));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
  });

  it('keeps friend money out of the expense total', async () => {
    const user = userEvent.setup();
    open();

    await addExpense(user, '1200', 'Fuel', 'GPay');
    await user.click(screen.getByRole('tab', { name: 'Friends' }));

    await user.type(screen.getByLabelText('Amount'), '5000');
    await user.type(screen.getByLabelText('Who?'), 'Arun');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('1 expense')).toBeInTheDocument();
    const owed = screen.getByText('They owe me').closest('.tile') as HTMLElement;
    expect(within(owed).getByText('₹5,000')).toBeInTheDocument();
  });

  it('nets a part repayment and shows it under the person', async () => {
    const user = userEvent.setup();
    open();
    await user.click(screen.getByRole('tab', { name: 'Friends' }));

    await user.type(screen.getByLabelText('Amount'), '5000');
    await user.type(screen.getByLabelText('Who?'), 'Arun');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await user.type(screen.getByLabelText('Amount'), '2000');
    await user.type(screen.getByLabelText('Who?'), 'Arun');
    await user.click(screen.getByLabelText('Got back'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await user.click(screen.getByRole('tab', { name: 'Who owes what' }));
    const person = screen.getByText('Arun').closest('summary') as HTMLElement;
    expect(within(person).getByText('owes me')).toBeInTheDocument();
    expect(within(person).getByText('₹3,000')).toBeInTheDocument();
  });

  it('flips the source label when money comes towards you', async () => {
    const user = userEvent.setup();
    open();
    await user.click(screen.getByRole('tab', { name: 'Friends' }));

    expect(screen.getByRole('radiogroup', { name: 'Paid with' })).toBeInTheDocument();
    await user.click(screen.getByLabelText('I borrowed'));
    expect(screen.getByRole('radiogroup', { name: 'Received in' })).toBeInTheDocument();
  });

  it('survives a reload through localStorage', async () => {
    const user = userEvent.setup();
    const first = open();
    await addExpense(user, '999', 'Dinner', 'GPay');
    first.unmount();

    open();
    expect(headline()).toBe('₹999');
    expect(rows().getByText('Dinner')).toBeInTheDocument();
  });

  it('writes the same storage shape as the single-file version', async () => {
    const user = userEvent.setup();
    open();
    await addExpense(user, '100', 'Tea', 'GPay');

    const saved = JSON.parse(window.localStorage.getItem('simple-money/v1')!);
    expect(Object.keys(saved).sort()).toEqual(['cardNames', 'expenses', 'loans']);
    expect(saved.expenses[0]).toMatchObject({ amount: 10000, note: 'Tea', method: 'gpay', date: today });
  });
});
