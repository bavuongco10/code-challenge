# T07 — Sell/Buy panels, presets, flip

Status: done
Depends: T04, T05
Owns: `src/features/swap/components/{AmountPanel,AmountPresets,TokenButton,FlipButton}.tsx`; slots `T07 sell panel`, `T07 flip`, `T07 buy panel` in `SwapCard.tsx`
Read: `../plan.md` (Amount input, Connected UI → balances/presets), `design.md` (Layout), UI contract rows Amount inputs … Presets

## Checklist

- [x] `AmountPanel({ side })`: Headless UI `Field` + `Label` ("Amount to send"/"Amount to receive") + `Input` `#input-amount`/`#output-amount`, `inputmode="decimal"`, `autoComplete="off"`, value from `amountsAtom`, `onChange` → `setAmountAtom`
- [x] `#sell-usd`/`#buy-usd` bottom-left: `formatUsd`
- [x] `#sell-balance`/`#buy-balance` bottom-right when connected: `formatAmount(balance) + " " + symbol`
- [x] `insufficientAtom` → `.is-error` on `#input-amount` and `#sell-balance` (danger colour), `aria-invalid` + `aria-describedby` to the balance
- [x] `TokenButton`: `#sell-token`/`#buy-token`, `TokenIcon` + `.token-symbol`; `.is-empty` "Select token" when null; opens picker (`pickerSideAtom`)
- [x] `AmountPresets`: `.amount-preset[data-percent]` 25/50/75/100 (label `Max` for 100); rendered only when connected, sell balance > 0, and the panel is hovered or focus-within (CSS can't remove from DOM; use `useState` for hover/focus so e2e `toHaveCount(0)` holds when hidden for zero balance)
- [x] `FlipButton`: `#switch-tokens`, `aria-label="Switch tokens"`, overlaps the panels, icon rotates in 4 steps
- [x] Panel focus → `primary` border

## e2e

`pnpm test:e2e -g "conversion|sanitising|token switching|presets|preset|insufficient|exact-out|equal to balance"` (needs T08)

## Handoff notes

Presets render only on hover/focus-within of the Sell panel (useState). Flip icon rotates 180deg per click in steps(4). Two failures in a full run came from other agents wiping test-results/; both pass on rerun.
