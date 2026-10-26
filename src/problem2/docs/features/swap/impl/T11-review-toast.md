# T11 — Review dialog, swap flow, toast

Status: done
Depends: T04, T05 (and T03's `applySwapAtom`)
Owns: `src/features/swap/swapFlow.ts` (+ `.test.ts`), `src/features/swap/components/{ReviewDialog,SwapToast}.tsx`; slots `T11 review dialog`, `T11 toast` in `SwapCard.tsx`
Read: `../plan.md` (Swap flow steps 1–5), `contracts.md` (Swap flow, constants), `e2e/wallet.spec.ts → swap flow`

## Checklist

- [x] `#review-dialog` Headless UI `Dialog` on `reviewOpenAtom`, title "You're swapping"; ✕ / Escape / backdrop close and keep the form
- [x] `#review-sell` / `#review-buy`: `TokenIcon`, `formatAmount + symbol`, USD value
- [x] `#review-more` toggles `#review-details` (rate, fee, max slippage, min received; reuse formatters, **not** the `#detail-*` ids, to keep ids unique)
- [x] `#confirm-swap` → `confirmSwapAtom`; `.is-confirming` + `disabled` + Spinner + "Confirm in wallet" during `SIGN_MS`
- [x] `confirmSwapAtom`: snapshot quote → wait `SIGN_MS` → close review, `resetAmountsAtom`, toast pending → wait `PENDING_MS` → `applySwapAtom` → toast success (or error "Swap failed") → auto-dismiss after `TOAST_MS`. Use `setTimeout` (e2e drives it with `page.clock`)
- [x] `#swap-toast` `role="status"`, `.is-pending|.is-success|.is-error`, `.toast-title` (Swapping/Swapped/Swap failed), `.toast-body` exactly `1 ETH for 2000 USDC`; `#swap-toast-close` only when not pending
- [x] Unit test `confirmSwapAtom` with `vi.useFakeTimers()`: pending → success, balances, error path

## e2e

`pnpm test:e2e -g "swap flow|persist"`

## Handoff notes

Done. `confirmingAtom` + `confirmSwapAtom` live in `swapFlow.ts` (not atoms.ts). ReviewDialog returns null without a quote, and ignores close while confirming. Toast auto-dismiss only clears if the toast is still the same one. e2e `swap flow|persist`: 5/5 pass. `pnpm check` fails only on prettier formatting of T10's doc (not mine).
