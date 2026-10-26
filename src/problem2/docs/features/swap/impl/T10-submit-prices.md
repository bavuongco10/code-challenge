# T10 — Submit button, price loading/error

Status: done
Depends: T04, T05
Owns: `src/features/swap/components/{SubmitButton,PricesError}.tsx`; slots `T10 submit`, `T10 prices error` in `SwapCard.tsx`
Read: `../plan.md` (Validation, Features 8–9), `design.md` (Submit colours)

## Checklist

- [x] `#swap-submit` class `is-${submitStateAtom}`; label per Validation table (`Not enough <SYMBOL>`); text node is the label only (Spinner/icons are `aria-hidden` SVG)
- [x] Enabled only for `is-ready` (→ `reviewOpenAtom = true`) and `is-connect` (→ `connectAtom`)
- [x] `is-loading-prices` shows the spinner beside the label
- [x] `is-prices-error` ("Prices unavailable", no spinner) while `#prices-error` is shown
- [x] `aria-live="polite"` region announcing the label change (visually hidden sibling, not the button itself)
- [x] `#prices-error` `role="alert"`: "Couldn't load prices" + `#prices-retry` → `retryPricesAtom`; gone once ready

## e2e

`pnpm test:e2e -g "defaults and submit|price loading|Not enough|Connect wallet"`

## Handoff notes

SubmitButton reads submitStateAtom (reads pricesAtom, so prices load). Label is mirrored in an sr-only aria-live span. PricesError self-hides unless pricesAtom.state is error. Insufficient state uses `bg-danger`.
