# Money Tracker — React

The single-file `money-page.html` tracker, ported to React 18 + Vite +
TypeScript. Same screens, same behaviour, same stored data.

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run test
npm run build
```

## Same data as the HTML version

Both read and write `localStorage` under `simple-money/v1`, in the same
shape. A `.json` backup exported from the HTML page restores into this app
and the other way round — which is also how you move data between your
phone and your laptop, since nothing syncs.

Amounts are integer **paise** everywhere. `₹1,240.50` is `124050`. Adding
hundreds of entries never drifts by a rupee.

## Layout

```
src/
  domain/
    types.ts        the shapes: Expense, Loan, PaymentMethod, LoanKind
    constants.ts    payment methods, the four friend movements and their signs
    selectors.ts    every derived number: month totals, per-method, per-person
  lib/
    money.ts        paise parsing and ₹ formatting
    dates.ts        YYYY-MM-DD helpers, local time not UTC
    csv.ts          the two CSV exports and the JSON backup
  store/
    storage.ts      localStorage, plus shape-checking anything read back
    reducer.ts      pure reducer with a typed action union
    StoreContext.tsx
  hooks/
    usePersistentChoice.ts   remembered tab and scope
    useDownloads.ts          the host's save API, absent outside it
  components/       Money, Field, Tabs, ConfirmDialog, Icons
  features/         ExpenseForm, ExpenseList, CardsPanel, FriendsPanel, BackupPanel
```

`src/domain` and `src/lib` are pure TypeScript — no React, no browser — so
they are unit tested directly. `src/__tests__/app.test.tsx` covers the
screens end to end.

## The rules worth not breaking

- **Friend money is never an expense.** Giving ₹5,000 to a friend must not
  move the month total. It is the whole reason the Friends tab is separate.
- **A friend's balance is one signed number.** Gave and repaid push it up,
  got-back and borrowed push it down. Positive means they owe you. A part
  repayment then needs no special handling.
- **Friend balances are always all-time**, even when the list is filtered to
  a month. An August loan is still owed in November.
- **Today means actual today**, not the month being browsed.

## Deliberately not here

No routing — four tabs do not need a router. No Redux, no React Query (there
is no server), no form library for a five-field form. Adding them would look
more senior and make the app worse.

## Downloads

A published page cannot start a download itself; the host asks the viewer and
writes the file. `useDownloads` resolves that API when it exists and reports
`available: false` when it does not, so the buttons stay hidden rather than
pretending to work. Running locally with `npm run dev`, that is the normal
case — restore still works, since a file input needs no permission.
