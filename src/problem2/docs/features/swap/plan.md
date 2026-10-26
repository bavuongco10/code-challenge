# Swap

Currency swap. Users pick two tokens and enter an amount on either side. The other side
updates from the latest prices. Swapping needs a connected wallet. Full brief: `.problem/problem.md`.

Two wallet modes, flipped with a switch (see [Wallet](#wallet)):

- **Phase 1, Demo wallet:** a fake wallet stored in localStorage.
- **Phase 2, Sepolia wallet:** a real testnet wallet. The switch shows it as disabled until it is built.

E2E specs: `e2e/swap.spec.ts` and `e2e/wallet.spec.ts` (run with `pnpm test:e2e`). They find
elements by the ids and check state through the classes listed in [UI contract](#ui-contract-e2e).

Look: 8-bit pixel style, see [`impl/design.md`](impl/design.md). Build plan and task
breakdown: [`impl/README.md`](impl/README.md).

## External data

- Prices: `https://interview.switcheo.com/prices.json`, shaped
  `[{ currency, date, price }]`. There are duplicates (USDC ×4, BUSD ×2): **the latest `date`
  wins**. Entries with no finite positive `price` are dropped.
- Icons: `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/<SYMBOL>.svg`.
  If one fails to load, show a circle with the symbol's first letter.
- Phase 1 has no backend: the wallet, balances, signing and confirmation are all faked (see Wallet).

## Features

| #   | Feature                                                                           |
| --- | --------------------------------------------------------------------------------- |
| 1   | Sell / Buy panels: amount input, token button, USD value                          |
| 2   | Either side can be typed; the other side is computed (exact in / exact out)       |
| 3   | Token picker dialog: search, empty state, keyboard, only tokens that have a price |
| 4   | Switch-tokens button (flip)                                                       |
| 5   | Rate line `1 A = x B ($y)`; clicking it inverts the rate                          |
| 6   | Expandable details under the rate: fee, max slippage, minimum received            |
| 7   | Settings popover (gear): max slippage, swap deadline                              |
| 8   | Submit button shows why the form can't be submitted (see Validation)              |
| 9   | Price loading and error states with Retry                                         |
| 10  | Dark NES theme, mobile layout                                                     |
| 11  | Wallet mode switch: Demo (phase 1) / Sepolia (phase 2)                            |
| 12  | Connect, plus an account menu: address, disconnect, recent activity               |
| 13  | Balances under each panel and in the token picker ("Your tokens")                 |
| 14  | 25% / 50% / 75% / Max buttons on the Sell panel                                   |
| 15  | Insufficient-balance validation                                                   |
| 16  | Review dialog, then confirm, then a pending toast, then a success toast           |
| 17  | Guided tour (react-joyride) of the main controls; header `?` replays it           |

## Rules

- Defaults: sell ETH, buy not selected, both amounts empty.
- Panel labels: Sell is "Amount to send", Buy is "Amount to receive" (wording from `.problem/index.html`).
- Picking the token that is already on the other side swaps the two sides.
- Flip swaps the tokens. The typed amount stays with its token and moves to the other
  side, and the other side is recomputed.
- Clearing the typed amount clears the computed amount as well.

### Validation (submit button state; disabled unless `is-ready` or `is-connect`)

| Condition                      | Class               | Label                |
| ------------------------------ | ------------------- | -------------------- |
| Prices still loading           | `is-loading-prices` | `Loading prices…`    |
| Prices failed to load          | `is-prices-error`   | `Prices unavailable` |
| Either token not selected      | `is-select-token`   | `Select a token`     |
| Amount empty, `0`, or only `.` | `is-enter-amount`   | `Enter an amount`    |
| No wallet connected            | `is-connect`        | `Connect wallet`     |
| Sell amount > sell balance     | `is-insufficient`   | `Not enough ETH`     |
| Everything valid               | `is-ready`          | `Review`             |

- The rows are checked top to bottom and the first match wins. `is-connect` connects the wallet.
- Insufficient balance: the sell amount and the sell balance both turn red (`.is-error`).
  The `ETH` in the label is the sell token's symbol.
- Price load fails: `#prices-error` (`role="alert"`) shows "Couldn't load prices" with a Retry button.
- Picker search finds nothing: "No results found for <query>".

### Amount input

- `inputmode="decimal"`. Each keystroke is sanitised, so the field never holds a
  non-numeric value and no inline error is needed:
  - characters other than digits and `.` are dropped, and `,` becomes `.` (`1,5` → `1.5`)
  - only the first `.` is kept (`1.2.3` → `1.23`). A leading `.5` is allowed
  - at most 8 decimals, extra digits are ignored
- What the user typed is shown exactly as typed. Leading zeros are not stripped.

### Details (expandable)

- Shown only when there is a quote: both tokens set and the amount is greater than 0.
  Collapsed by default. A chevron button toggles it (`aria-expanded`).
- Rows:
  - Fee: `Free`.
  - Max slippage: an `Auto` tag while Auto is on, then the value (`0.5%`).
  - Minimum received: `buy × (1 − slippage)`, formatted like a computed amount, followed by
    the symbol (`1990 USDC`). In exact-out mode it is still the buy amount after slippage.

### Settings (gear popover)

- Escape or a click outside closes it. Values last only until the page is reloaded.
- **Max slippage** (%): a `?` tooltip explains it (as for min received and swap deadline). Auto (0.5%) is the default. The input is empty and shows `0.5` as a
  placeholder.
  - Typing a value turns Auto off. Clicking `Auto`, or blurring with an empty field or `0`,
    switches back to Auto.
  - Input: digits and one `.`, at most 2 decimals, and a keystroke that would go over 100
    is ignored (`150` → `15`).
  - Warnings show under the label, and the gear shows the value in the same colour:
    - over 5.5 and under 20: "High slippage" (`is-high`, amber)
    - 20 or more: "Very high slippage" (`is-very-high`, red)
  - A custom value is also shown on the gear as a badge, e.g. `1%`.
- **Swap deadline** (minutes): defaults to 30.
  - Whole minutes only. Values are clamped to 4320 (3 days).
  - Blurring with an empty field or `0` resets it to 30.
  - 60 or more: "High deadline" warning.
- Warnings are linked to their input with `aria-describedby`.

## Wallet

### Mode switch

- A header switch `#wallet-mode` offers `Demo` / `Sepolia`. Its value is saved in localStorage as
  `swap:walletMode` (`demo` | `sepolia`) and defaults to `demo`.
- Until phase 2 ships, `Sepolia` is shown but disabled, with the tooltip "Coming soon". Each mode
  keeps its own connection, so switching modes disconnects.

### Demo wallet (phase 1)

- State lives in localStorage under `swap:wallet`:
  `{ connected, address, balances: { [symbol]: string }, activity: [{ sell, sellAmount, buy, buyAmount, at }] }`.
  It survives a reload. Balances are decimal strings with at most 8 decimals.
- When nothing is stored yet, connecting creates the wallet with address
  `0x1234567890abcdef1234567890abcdef12345678` and balances
  `ETH 1.5`, `USDC 1000`, `SWTH 250000`. Every other token starts at 0.
- Connect (the header button `#connect-wallet` or the submit button in `is-connect`) takes effect
  at once.
- Disconnect (`#disconnect` in the account menu) sets `connected: false`. Balances and
  activity stay, so reconnecting brings them back.
- Never lose data: a corrupt `swap:wallet` value is reset to the defaults instead of throwing.
- The demo wallet always signs.

### Connected UI

- The header shows the short address `0x1234...5678` (first 6 and last 4 characters) as
  `#account-button`. It opens `#account-menu`, which has the full address, a disconnect button, and
  "Recent activity" (newest first, max 5): `Swapped` · `1 ETH → 2000 USDC` · relative time.
- Under the swap card, a terminal "Trade log" (`#trade-log`, `.trade-log-item`) shows up to 5 latest
  swaps as `HH:MM SWAPPED 0.25 ETH → 698.25 USDC` (24h, local time), newest first, one truncated line
  each. Empty: "No swaps yet". It never makes the page scroll: it takes only the height left in the
  viewport (lines that don't fit are dropped whole), and is hidden when the viewport is under 760px tall.
- Each panel shows its balance at the bottom right (`#sell-balance`, `#buy-balance`), formatted
  like a computed amount followed by the symbol (`1.5 ETH`). The USD value stays at the bottom left.
- The token picker shows a "Your tokens" section first: tokens with a balance above 0,
  each with its balance (`.token-balance`). The rest follow under "All tokens". A token
  appears only once, so `#token-option-<SYMBOL>` stays unique.
- **25% / 50% / 75% / Max** (`.amount-preset[data-percent]`): shown on the Sell panel
  when hovered or focused, and only when the wallet is connected and the sell balance is above 0.
  - Each fills the sell amount with balance × percent, keeping full precision (up to 8 decimals,
    trailing zeros trimmed), and switches to exact-in mode.
  - Max fills the whole balance. ponytail: the demo has no gas, so nothing is kept back.
    Phase 2 keeps a gas reserve.

### Swap flow

1. `Review` opens `#review-dialog` ("You're swapping"). It shows the sell and buy amounts with
   symbol and USD value (`#review-sell`, `#review-buy`), a "Show more" toggle (`#review-more`)
   that reveals rate, fee, max slippage and minimum received, and `#confirm-swap`.
   Amounts use the same 6-significant-digit format as the panels.
   Closing it (✕, Escape, or a click outside) keeps the form unchanged.
2. Confirm: `#confirm-swap` shows a spinner and "Confirm in wallet" (`is-confirming`, disabled)
   for about 1 s while the demo wallet "signs".
3. Once signed, the dialog closes, both amounts reset (tokens stay), and `#swap-toast` appears
   with `is-pending`: "Swapping" / `1 ETH for 2000 USDC`, with no close button.
4. About 2 s later the toast switches to `is-success`: "Swapped" / `1 ETH for 2000 USDC`,
   gains a close button (`#swap-toast-close`), and dismisses itself after 10 s.
   At that moment the balances update (sell − amount, buy + quoted amount) and an activity entry is added.
5. If the balance changed in the meantime and is now too low, the swap fails: an `is-error`
   toast says "Swap failed" and the balances stay unchanged.

### Sepolia wallet (phase 2)

Decisions: [ADR 0002](../../adr/0002-sepolia-wallet-and-quotes.md). Build plan: [`impl/phase2-sepolia.md`](impl/phase2-sepolia.md).

- The header shows a testnet badge, and the account menu says "You are in testnet mode".
- If the wallet is on another network, it is asked to switch first. Refusing shows the toast
  "Failed to switch networks — switch to Sepolia in your wallet's settings." The review
  dialog stays open, so the user can retry.
- Max keeps some ETH back for gas. When the amount fits the balance but not the gas, the label
  says "Not enough ETH" and a banner reads "Not enough ETH on Sepolia to swap".
- Review rows add Network cost (`<0.001 ETH`).
- After signing the steps are the same as phase 1. Pending lasts until the transaction is
  mined, and balances come from the chain afterwards.

### Guided tour

- Shows automatically on every visit until the user clicks Next or Skip once. That saves `swap:tourDone = true` in localStorage and it stops auto-showing.
- Overlay clicks and Escape don't dismiss it; Back doesn't count as seen.
- Steps: wallet mode, connect/account, sell amount, sell token, buy token, settings, submit,
  trade log. Missing targets (e.g. trade log on short screens) are skipped.
- The header `#tour-start` (`?`) button replays it from step 1 at any time.
- e2e: Playwright's `storageState` presets `swap:tourDone` so the overlay never blocks other
  tests; the tour tests clear it.

### Number formatting (en-US)

- Computed amount: at most 6 significant digits, no thousands separators, never exponent
  notation. `2000`, `0.617284`, `0.00000016`, `2000000000`.
- USD value: `$0` when empty. `<$0.01` when greater than 0 but under a cent. `$1,234.56` below
  $1M. Compact at $1M and above: `$2.00B`, `$76.27M`.
- Rate: `1 ETH = 2000 USDC ($2,000.00)`. The rate number follows the computed-amount
  rules, and the USD figure is the price of the left-hand token.
- Percentages: no trailing zeros (`0.5%`, `1%`, `5.51%`).

## UI contract (e2e)

Tests locate elements by id and assert state through classes. Text is asserted only for
formatted values. The ids and classes are part of the feature's API, so don't rename
them without updating the spec.

| Element                 | id / class                                                                 |
| ----------------------- | -------------------------------------------------------------------------- |
| Amount inputs           | `#input-amount`, `#output-amount`                                          |
| USD values              | `#sell-usd`, `#buy-usd`                                                    |
| Token buttons           | `#sell-token`, `#buy-token`; `.token-symbol` inside; `.is-empty` when none |
| Flip                    | `#switch-tokens`                                                           |
| Token picker            | `#token-picker`, `#token-search`, `.token-option`, `#token-empty`          |
| One option              | `#token-option-<SYMBOL>`                                                   |
| Rate                    | `#rate` (button), `.is-inverted`                                           |
| Details                 | `#details-toggle`, `#swap-details`                                         |
| Detail rows             | `#detail-fee` (`.is-free`), `#detail-min-received`                         |
| Detail slippage         | `#detail-slippage` with `.slippage-auto`, `.slippage-value`                |
| Settings                | `#settings-toggle` (`.is-high` / `.is-very-high`), `#settings-panel`       |
| Gear badge              | `.slippage-badge` inside `#settings-toggle`                                |
| Slippage                | `#slippage-auto` (`.is-active`), `#slippage-input`, `#slippage-warning`    |
| Deadline                | `#deadline-input`, `#deadline-warning`                                     |
| Submit                  | `#swap-submit` with a state class from Validation                          |
| Prices error            | `#prices-error`, `#prices-retry`                                           |
| Wallet mode             | `#wallet-mode` with `[data-mode=demo]`, `[data-mode=sepolia]` options      |
| Connect / account       | `#connect-wallet`, `#account-button`, `#account-menu`, `#disconnect`       |
| Activity                | `#activity .activity-item`                                                 |
| Balances                | `#sell-balance`, `#buy-balance` (`.is-error` when too low)                 |
| Sell amount error       | `#input-amount.is-error`                                                   |
| Picker balances         | `.token-balance` inside `.token-option`                                    |
| Presets                 | `.amount-preset[data-percent="25"\|"50"\|"75"\|"100"]`                     |
| Review                  | `#review-dialog`, `#review-sell`, `#review-buy`, `#review-more`            |
| Review details          | `#review-details`, `#confirm-swap` (`.is-confirming`)                      |
| Toast (`role="status"`) | `#swap-toast` (`.is-pending` / `.is-success` / `.is-error`)                |
| Toast parts             | `.toast-title`, `.toast-body`, `#swap-toast-close`                         |
| Guided tour             | `#tour-start` (replay), `#tour-tooltip`                                    |

## Gotchas

- Prices date from 2023 and never change, so they are fetched once and not polled.
- ponytail: demo balances use JS numbers for the arithmetic, so long chains of swaps can drift by
  about 1e-12. That's fine for a demo. Phase 2 switches to bigint base units.

## History

- Original brief: `.problem/problem.md`.
