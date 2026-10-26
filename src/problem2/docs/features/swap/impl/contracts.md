# Contracts

The fixed seams between tasks. Build against these names; don't rename without the lead's OK
(see README → Protocol). Ids and classes for the DOM are in `../plan.md` → UI contract.

## Files

Everything lives in one feature, `src/features/swap/` (the wallet only exists for swapping,
so it is not its own feature). Owner task in brackets.

```
index.html                         fonts, title "Pixel Swap"                       [T00]
src/main.tsx                       mounts app/App                                  [T00]
src/index.css                      tailwind, @theme tokens, pixel utilities        [T00]
src/app/App.tsx                    layout + slots                                  [T00]
src/features/swap/
  index.ts                         export { SwapCard, WalletHeader }               [T00]
  types.ts                         shared types below                              [T00]
  constants.ts                     timings, defaults, URLs, storage keys           [T00]
  lib/amount.ts (+ .test.ts)       sanitize/parse inputs                           [T01]
  lib/format.ts (+ .test.ts)       number + address formatting                     [T01]
  lib/convert.ts (+ .test.ts)      conversion, min received                        [T01]
  api/fetchPrices.ts (+ .test.ts)  fetch + cleanup                                 [T02]
  walletAtoms.ts (+ .test.ts)      demo wallet state                               [T03]
  components/PixelIcon.tsx         16×16 pixel icons                               [T04]
  components/Spinner.tsx           8-frame spinner                                 [T04]
  components/TokenIcon.tsx         icon with letter fallback                       [T04]
  atoms.ts (+ .test.ts)            swap state                                      [T05]
  components/SwapCard.tsx          card layout + slots                             [T05]
  components/WalletHeader.tsx      + WalletModeSwitch, AccountMenu                 [T06]
  components/AmountPanel.tsx       + AmountPresets, TokenButton, FlipButton        [T07]
  components/TokenPicker.tsx                                                       [T08]
  components/RateDetails.tsx       + SettingsPopover                               [T09]
  components/SubmitButton.tsx      + PricesError                                   [T10]
  swapFlow.ts (+ .test.ts)         confirm → sign → pending → success atoms        [T11]
  components/ReviewDialog.tsx      + SwapToast                                     [T11]
```

One component per file; "+ X" means the task also owns `components/X.tsx` (or `X.ts`).

## Types (`types.ts`, T00)

```ts
export type Side = "sell" | "buy";
export type Prices = Record<string, number>; // symbol → USD, latest date, finite > 0
export type WalletMode = "demo" | "sepolia";
export type Activity = {
  sell: string;
  sellAmount: string;
  buy: string;
  buyAmount: string;
  at: number; // ms epoch
};
export type Wallet = {
  connected: boolean;
  address: string;
  balances: Record<string, string>; // decimal strings, ≤ 8 decimals
  activity: Activity[]; // newest first
};
export type Quote = {
  sell: string;
  buy: string; // symbols
  sellAmount: number;
  buyAmount: number;
  rate: number; // buy per 1 sell
};
export type SubmitState =
  | "loading-prices"
  | "select-token"
  | "enter-amount"
  | "connect"
  | "insufficient"
  | "ready"; // DOM class = `is-${state}`
export type SlippageLevel = "high" | "very-high" | null;
export type Toast = {
  status: "pending" | "success" | "error";
  sell: string;
  sellAmount: string;
  buy: string;
  buyAmount: string; // formatted
} | null;
```

## Constants (`constants.ts`, T00)

```ts
export const PRICES_URL = "https://interview.switcheo.com/prices.json";
export const ICON_URL = (s: string) =>
  `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${s}.svg`;
export const WALLET_KEY = "swap:wallet";
export const WALLET_MODE_KEY = "swap:walletMode";
export const DEMO_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
export const DEMO_BALANCES = { ETH: "1.5", USDC: "1000", SWTH: "250000" };
export const DEFAULT_SELL = "ETH";
export const AUTO_SLIPPAGE = 0.5; // %
export const DEFAULT_DEADLINE = 30; // minutes
export const MAX_DEADLINE = 4320;
export const SIGN_MS = 1000; // confirm → signed
export const PENDING_MS = 2000; // pending → success
export const TOAST_MS = 10_000; // success auto-dismiss
export const MAX_ACTIVITY = 5; // shown in the menu
```

## Pure functions (T01, T02)

```ts
// lib/amount.ts
sanitizeAmount(raw: string): string            // plan → Amount input
sanitizeSlippage(prev: string, raw: string): string // ≤ 2 decimals; returns prev if > 100
sanitizeDeadline(raw: string): string          // digits only, clamped to MAX_DEADLINE
toNumber(s: string): number                    // "" | "." → 0; ".5" → 0.5
// lib/format.ts
formatAmount(n: number): string                // ≤ 6 sig digits, no separators, no exponent
formatBalance(n: number): string               // ≤ 8 decimals, trailing zeros trimmed (presets, storage)
formatUsd(n: number): string                   // $0, <$0.01, $1,234.56, $2.00B
formatPercent(n: number): string               // 0.5%, 1%, 5.51%
formatRate(q: Quote, inverted: boolean, prices: Prices): string // "1 ETH = 2000 USDC ($2,000.00)"
shortAddress(a: string): string                // 0x1234...5678
// lib/convert.ts
convert(amount: number, fromPrice: number, toPrice: number): number
minReceived(buyAmount: number, slippagePct: number): number
// api/fetchPrices.ts
parsePrices(json: unknown): Prices             // latest date wins; drops bad prices; throws on non-array
fetchPrices(signal?: AbortSignal): Promise<Prices> // throws on !res.ok
```

## Atoms

Primitive atoms hold the minimum; everything else is derived. Write atoms (`atom(null, fn)`)
carry the logic so components stay dumb.

**Wallet (`walletAtoms.ts`, T03)** — `atomWithStorage(…, { getOnInit: true })`, corrupt JSON
falls back to the default.

| Atom             | Kind         | Value / args                                                                  |
| ---------------- | ------------ | ----------------------------------------------------------------------------- |
| `walletModeAtom` | storage      | `WalletMode`, default `demo`, not written until set                           |
| `walletAtom`     | storage      | `Wallet \| null` (null = never connected)                                     |
| `connectedAtom`  | derived      | `boolean`                                                                     |
| `balancesAtom`   | derived      | `Partial<Record<string, number>> \| null` (null = not connected; read `?? 0`) |
| `connectAtom`    | write        | `()` creates defaults if null, sets `connected`                               |
| `disconnectAtom` | write        | `()` sets `connected: false`, keeps the rest                                  |
| `applySwapAtom`  | write → bool | `(a: Activity)`; false (no change) if balance too low                         |

**Swap (`atoms.ts`, T05)**

| Atom                | Kind    | Value / args                                                               |
| ------------------- | ------- | -------------------------------------------------------------------------- |
| `pricesAtom`        | derived | `{ state: "loading" } \| { state: "error" } \| { state: "ready", prices }` |
| `retryPricesAtom`   | write   | `()` refetches                                                             |
| `tokensAtom`        | derived | `string[]` priced symbols, A→Z                                             |
| `sellTokenAtom`     | prim    | `string \| null`, default `ETH`                                            |
| `buyTokenAtom`      | prim    | `string \| null`, default null                                             |
| `typedSideAtom`     | prim    | `Side` (sell = exact-in)                                                   |
| `typedAmountAtom`   | prim    | `string` as typed (sanitised)                                              |
| `amountsAtom`       | derived | `{ sell: string; buy: string }` shown in the inputs                        |
| `quoteAtom`         | derived | `Quote \| null` (null unless both tokens + amount > 0)                     |
| `setAmountAtom`     | write   | `(side: Side, raw: string)` sanitises, sets typed side                     |
| `setPresetAtom`     | write   | `(percent: number)` fills sell from balance, exact-in                      |
| `pickerSideAtom`    | prim    | `Side \| null` which picker is open                                        |
| `pickTokenAtom`     | write   | `(side, symbol)` swaps sides if already on the other side; closes picker   |
| `flipAtom`          | write   | `()`                                                                       |
| `slippageInputAtom` | prim    | `string`, `""` = Auto                                                      |
| `slippageAtom`      | derived | `number` effective %                                                       |
| `slippageLevelAtom` | derived | `SlippageLevel`                                                            |
| `deadlineInputAtom` | prim    | `string`, default `"30"`                                                   |
| `minReceivedAtom`   | derived | `number \| null`                                                           |
| `submitStateAtom`   | derived | `SubmitState`                                                              |
| `insufficientAtom`  | derived | `boolean` (drives `.is-error` on amount + balance)                         |
| `reviewOpenAtom`    | prim    | `boolean`                                                                  |
| `toastAtom`         | prim    | `Toast`                                                                    |
| `resetAmountsAtom`  | write   | `()` clears amounts, keeps tokens                                          |

**Swap flow (`swapFlow.ts`, T11)**

| Atom              | Kind  | Value / args                                                                                      |
| ----------------- | ----- | ------------------------------------------------------------------------------------------------- |
| `confirmingAtom`  | prim  | `boolean` (drives `#confirm-swap.is-confirming`)                                                  |
| `confirmSwapAtom` | write | `async ()` sign → close review → reset → pending → `applySwapAtom` → success/error → auto-dismiss |

## Slots

`src/app/App.tsx` and `components/SwapCard.tsx` mark where each task plugs in:

```tsx
{
  /* slot: T09 settings gear */
}
```

A task replaces only its own slot line with its component (and the import). Nothing else in
those files changes, so parallel merges don't conflict.

Slots: App → `T06 header`. SwapCard → `T09 settings gear`, `T07 sell panel`, `T07 flip`,
`T07 buy panel`, `T09 rate + details`, `T10 prices error`, `T10 submit`, `T08 token picker`,
`T11 review dialog`, `T11 toast`.
