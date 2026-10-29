# Problem 3: Messy React (Solution)

## Issues

### Bugs (wrong output or won't compile)

1. **`lhsPriority` doesn't exist.** The filter calls `getPriority` and stores the result in `balancePriority`, then checks `lhsPriority`. That's a TS compile error, or a `ReferenceError` at runtime. The check should use `balancePriority`.
2. **The filter is backwards.** It keeps balances with `amount <= 0` and drops every positive balance. So the page shows only empty or negative wallets. It should keep `amount > 0`.
3. **`blockchain` isn't on `WalletBalance`.** `balance.blockchain` is used, but the interface doesn't declare it. The `any` type on `getPriority(blockchain: any)` hides the error. Add `blockchain` to the interface with a union type and drop `any`.
4. **The sort comparator returns `undefined` when two priorities are equal.** At runtime that's harmless: the spec coerces `undefined` to `NaN`, treats it as `0` (equal), and `sort` is stable since ES2019. But with `strictNullChecks` the type `-1 | 1 | undefined` isn't assignable to `number`, so it won't compile. Use `rightPriority - leftPriority`.
5. **`rows` maps over the wrong array.** `rows` is built from `sortedBalances`, but each item is typed as `FormattedWalletBalance`. The type is false, so `balance.formatted` is always `undefined`, and `formattedBalances` is computed and never used. Build the rows from the formatted list.
6. **`classes` is never defined.** There's no `useStyles()` or import, so this is a `ReferenceError`. The refactor drops `className`; the row styles belong in `WalletRow` itself.
7. **`prices[balance.currency]` can be `undefined`.** A token with no price gives `NaN` for the USD value. Don't fall back to `0` either: `$0.00` claims the holding is worthless. Pass `undefined` and let the row show a placeholder (`—`).

### Wasted work and anti-patterns

8. **`prices` is in the `useMemo` deps but isn't used inside.** Prices usually update often (polling or a websocket). Each update re-runs the filter and sort for nothing. The only deps should be `[balances]`.
9. **`getPriority` is defined inside the component.** It's recreated on every render, even though it doesn't use props or state. Move it out of the component as a constant lookup table.
10. **Priority is computed more than once per item.** It's computed once in the filter, then twice per comparison in the sort, which is O(n log n) calls. Compute it once per balance, then filter and sort on that value.
11. **`formattedBalances` and `rows` aren't memoized.** They're rebuilt on every render, including renders that have nothing to do with balances. Memoize the formatting together with the sort, and memoize rows on `[formatted, prices]`.
12. **`key={index}`.** Index keys break React's list reconciliation when the list is filtered or re-sorted, which happens here. Row state or DOM can end up attached to the wrong item. Use a stable id such as `` `${blockchain}-${currency}` ``.
13. **`toFixed()` with no argument rounds to 0 decimals.** `0.5 ETH` shows as `"1"`. A single fixed precision is wrong too: 2 decimals hides small balances (`0.004 BTC` → `"0.00"`). Use `Intl.NumberFormat` with 2 decimals or 4 significant digits, whichever keeps more (`roundingPriority: 'morePrecision'`): `1234.5678` → `"1,234.57"`, `0.004123` → `"0.004123"`. No per-token table to invent.
14. **`children` is pulled out of props and then ignored.** That silently swallows children. Either render them or don't destructure them.
15. **`BoxProps` are spread onto a plain `<div>`.** Box-only props (`sx`, `p`, `m`, and so on) end up on the DOM element, which triggers React unknown-prop warnings, and they have no effect. Render a `<Box>` instead, or type the props as `React.HTMLAttributes<HTMLDivElement>`.
16. **Minor:**
    - `interface Props extends BoxProps {}` is an empty interface. A type alias does the same job.
    - `React.FC<Props>` plus `(props: Props)` declares the type twice.
    - The `: WalletBalance` annotations inside the callbacks are redundant once the hook's return type is correct.

## Refactored

```tsx
type Blockchain = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo';

interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: Blockchain;
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
}

// Module-level constant: built once, not on every render.
const PRIORITY: Record<string, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};
const getPriority = (blockchain: string): number => PRIORITY[blockchain] ?? -99;

// Whichever keeps more precision: 2 decimals or 4 significant digits.
// 1234.5678 -> "1,234.57", 0.004123 -> "0.004123".
const amountFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  maximumSignificantDigits: 4,
  roundingPriority: 'morePrecision',
});

// Priority computed once per balance; drop unknown chains and non-positive amounts; highest priority first.
const prepareBalances = (balances: readonly WalletBalance[]): FormattedWalletBalance[] =>
  balances
    .map((b) => ({ b, priority: getPriority(b.blockchain) }))
    .filter(({ b, priority }) => priority > -99 && b.amount > 0)
    .sort((l, r) => r.priority - l.priority)
    .map(({ b }) => ({ ...b, formatted: amountFormat.format(b.amount) }));

// undefined (not 0) when there is no price: "$0.00" would claim the holding is worthless.
const usdValue = (b: WalletBalance, prices: Partial<Record<string, number>>): number | undefined => {
  const price = prices[b.currency];
  return price === undefined ? undefined : price * b.amount;
};

type Props = BoxProps;

const WalletPage = ({ children, ...rest }: Props) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  // Depends on balances only, so a price tick doesn't re-sort.
  const formattedBalances = useMemo(() => prepareBalances(balances), [balances]);

  const rows = useMemo(
    () =>
      formattedBalances.map((b) => (
        <WalletRow
          key={`${b.blockchain}-${b.currency}`}
          amount={b.amount}
          usdValue={usdValue(b, prices)} // undefined -> WalletRow renders "—"
          formattedAmount={b.formatted}
        />
      )),
    [formattedBalances, prices],
  );

  return (
    <Box {...rest}>
      {rows}
      {children}
    </Box>
  );
};

export default WalletPage;
```

## Side by side

| Original | Refactored | Fixes |
|---|---|---|
| `WalletBalance` without `blockchain`; `getPriority(blockchain: any)` | `blockchain: Blockchain` union; typed `getPriority` | 3 |
| `switch` inside the component, duplicate `20` cases | module-level `PRIORITY` lookup | 9 |
| `if (lhsPriority > -99) { if (balance.amount <= 0) return true }` | `priority > -99 && b.amount > 0` | 1, 2 |
| comparator returns `-1` / `1` / `undefined` | `r.priority - l.priority` | 4 |
| `getPriority` called in filter and twice per comparison | computed once per balance, then filter/sort | 10 |
| `useMemo(..., [balances, prices])` | `useMemo(..., [balances])` | 8 |
| `formattedBalances` / `rows` rebuilt every render | both memoized | 11 |
| `amount.toFixed()` | `Intl.NumberFormat` (2 dp or 4 sig. digits) | 13 |
| `rows` from `sortedBalances`, typed as formatted | `rows` from `formattedBalances` | 5 |
| `className={classes.row}` (undefined) | removed | 6 |
| `prices[currency] * amount` | `usdValue()` → `undefined` when unpriced, row shows `—` | 7 |
| `key={index}` | `` key={`${blockchain}-${currency}`} `` | 12 |
| `children` destructured, dropped | rendered | 14 |
| `<div {...rest}>` with `BoxProps` | `<Box {...rest}>` | 15 |
| `interface Props extends BoxProps {}`, `React.FC<Props> = (props: Props)` | `type Props = BoxProps`, typed destructure | 16 |
