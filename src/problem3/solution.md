# Problem 3: Messy React (Solution)

## Issues

### Bugs (wrong output or won't compile)

1. **`lhsPriority` doesn't exist.** The filter calls `getPriority` and stores the result in `balancePriority`, then checks `lhsPriority`. That's a TS compile error, or a `ReferenceError` at runtime. The check should use `balancePriority`.
2. **The filter is backwards.** It keeps balances with `amount <= 0` and drops every positive balance. So the page shows only empty or negative wallets. It should keep `amount > 0`.
3. **`blockchain` isn't on `WalletBalance`.** `balance.blockchain` is used, but the interface doesn't declare it. The `any` type on `getPriority(blockchain: any)` hides the error. Add `blockchain` to the interface with a union type and drop `any`.
4. **The sort comparator returns `undefined` when two priorities are equal.** A comparator must return a number for every pair. Otherwise the order is inconsistent between engines. Use `rightPriority - leftPriority`.
5. **`rows` maps over the wrong array.** `rows` is built from `sortedBalances`, but each item is typed as `FormattedWalletBalance`. The type is false, so `balance.formatted` is always `undefined`, and `formattedBalances` is computed and never used. Build the rows from the formatted list.
6. **`classes` is never defined.** There's no `useStyles()` or import, so this is a `ReferenceError`. The refactor drops `className`; the row styles belong in `WalletRow` itself.
7. **`prices[balance.currency]` can be `undefined`.** A token with no price gives `NaN` for the USD value. Fall back to `0`, or show a placeholder.

### Wasted work and anti-patterns

8. **`prices` is in the `useMemo` deps but isn't used inside.** Prices usually update often (polling or a websocket). Each update re-runs the filter and sort for nothing. The only deps should be `[balances]`.
9. **`getPriority` is defined inside the component.** It's recreated on every render, even though it doesn't use props or state. Move it out of the component as a constant lookup table. That also removes the duplicate `Zilliqa`/`Neo` cases.
10. **Priority is computed more than once per item.** It's computed once in the filter, then twice per comparison in the sort, which is O(n log n) calls. Compute it once per balance, then filter and sort on that value.
11. **`formattedBalances` and `rows` aren't memoized.** They're rebuilt on every render, including renders that have nothing to do with balances. Memoize the formatting together with the sort, and memoize rows on `[formatted, prices]`.
12. **`key={index}`.** Index keys break React's list reconciliation when the list is filtered or re-sorted, which happens here. Row state or DOM can end up attached to the wrong item. Use a stable id such as `` `${blockchain}-${currency}` ``.
13. **`toFixed()` with no argument rounds to 0 decimals.** `0.5 ETH` shows as `"1"`. A single fixed precision is wrong too: 2 decimals hides most of a BTC balance (`0.004 BTC` → `"0.00"`) yet is right for stablecoins. Use a per-token display precision.
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

// Display precision per token; unknown tokens get 4.
// ponytail: hard-coded map; read it from token metadata when the API exposes it.
const DECIMALS: Record<string, number> = { BTC: 8, ETH: 6, USDC: 2, USDT: 2 };
const format = (b: WalletBalance) => b.amount.toFixed(DECIMALS[b.currency] ?? 4);

type Props = BoxProps;

const WalletPage = ({ children, ...rest }: Props) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  // Depends on balances only, so a price tick doesn't re-sort.
  const formattedBalances = useMemo<FormattedWalletBalance[]>(
    () =>
      balances
        .map((b) => ({ b, priority: getPriority(b.blockchain) }))
        .filter(({ b, priority }) => priority > -99 && b.amount > 0)
        .sort((l, r) => r.priority - l.priority)
        .map(({ b }) => ({ ...b, formatted: format(b) })),
    [balances],
  );

  const rows = useMemo(
    () =>
      formattedBalances.map((b) => (
        <WalletRow
          key={`${b.blockchain}-${b.currency}`}
          amount={b.amount}
          usdValue={(prices[b.currency] ?? 0) * b.amount}
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
| `amount.toFixed()` | `toFixed(DECIMALS[currency] ?? 4)` | 13 |
| `rows` from `sortedBalances`, typed as formatted | `rows` from `formattedBalances` | 5 |
| `className={classes.row}` (undefined) | removed | 6 |
| `prices[currency] * amount` | `(prices[currency] ?? 0) * amount` | 7 |
| `key={index}` | `` key={`${blockchain}-${currency}`} `` | 12 |
| `children` destructured, dropped | rendered | 14 |
| `<div {...rest}>` with `BoxProps` | `<Box {...rest}>` | 15 |
| `interface Props extends BoxProps {}`, `React.FC<Props> = (props: Props)` | `type Props = BoxProps`, typed destructure | 16 |
