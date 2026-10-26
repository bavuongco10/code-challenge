# Problem 3: Messy React (Solution)

## Issues

### Bugs (wrong output or won't compile)

1. **`lhsPriority` doesn't exist.** The filter calls `getPriority` and stores the result in `balancePriority`, then checks `lhsPriority`. That's a TS compile error, or a `ReferenceError` at runtime. The check should use `balancePriority`.
2. **The filter is backwards.** It keeps balances with `amount <= 0` and drops every positive balance. So the page shows only empty or negative wallets. It should keep `amount > 0`.
3. **`blockchain` isn't on `WalletBalance`.** `balance.blockchain` is used, but the interface doesn't declare it. The `any` type on `getPriority(blockchain: any)` hides the error. Add `blockchain` to the interface with a union type and drop `any`.
4. **The sort comparator returns `undefined` when two priorities are equal.** A comparator must return a number for every pair. Otherwise the order is inconsistent between engines. Use `rightPriority - leftPriority`.
5. **`rows` maps over the wrong array.** `rows` is built from `sortedBalances`, but each item is typed as `FormattedWalletBalance`. The type is false, so `balance.formatted` is always `undefined`, and `formattedBalances` is computed and never used. Build the rows from the formatted list.
6. **`classes` is never defined.** There's no `useStyles()` or import, so this is a `ReferenceError`.
7. **`prices[balance.currency]` can be `undefined`.** A token with no price gives `NaN` for the USD value. Fall back to `0`, or show a placeholder.

### Wasted work and anti-patterns

8. **`prices` is in the `useMemo` deps but isn't used inside.** Prices usually update often (polling or a websocket). Each update re-runs the filter and sort for nothing. The only deps should be `[balances]`.
9. **`getPriority` is defined inside the component.** It's recreated on every render, even though it doesn't use props or state. Move it out of the component as a constant lookup table. That also removes the duplicate `Zilliqa`/`Neo` cases.
10. **Priority is computed more than once per item.** It's computed once in the filter, then twice per comparison in the sort, which is O(n log n) calls. Compute it once per balance, then filter and sort on that value.
11. **`formattedBalances` and `rows` aren't memoized.** They're rebuilt on every render, including renders that have nothing to do with balances. Memoize the formatting together with the sort, and memoize rows on `[formatted, prices]`.
12. **`key={index}`.** Index keys break React's list reconciliation when the list is filtered or re-sorted, which happens here. Row state or DOM can end up attached to the wrong item. Use a stable id such as `` `${blockchain}-${currency}` ``.
13. **`toFixed()` with no argument rounds to 0 decimals.** `0.5 ETH` shows as `"1"`. Pass the precision you want, or use `Intl.NumberFormat`.
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

type Props = BoxProps;

const WalletPage = ({ children, ...rest }: Props) => {
  const classes = useStyles();
  const balances = useWalletBalances();
  const prices = usePrices();

  // Depends on balances only, so a price tick doesn't re-sort.
  const formattedBalances = useMemo<FormattedWalletBalance[]>(
    () =>
      balances
        .map((b) => ({ b, priority: getPriority(b.blockchain) }))
        .filter(({ b, priority }) => priority > -99 && b.amount > 0)
        .sort((l, r) => r.priority - l.priority)
        .map(({ b }) => ({ ...b, formatted: b.amount.toFixed(2) })),
    [balances],
  );

  const rows = useMemo(
    () =>
      formattedBalances.map((b) => (
        <WalletRow
          key={`${b.blockchain}-${b.currency}`}
          className={classes.row}
          amount={b.amount}
          usdValue={(prices[b.currency] ?? 0) * b.amount}
          formattedAmount={b.formatted}
        />
      )),
    [formattedBalances, prices, classes.row],
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
