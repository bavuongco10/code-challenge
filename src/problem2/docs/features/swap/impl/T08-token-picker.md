# T08 — Token picker dialog

Status: done
Depends: T04, T05
Owns: `src/features/swap/components/TokenPicker.tsx` (+ `TokenOption.tsx` if wanted); slot `T08 token picker` in `SwapCard.tsx`
Read: `../plan.md` (Features 3, Connected UI → Your tokens), UI contract rows Token picker / One option / Picker balances

**Do this first in wave 3:** `e2e/helpers.ts → setup()` picks a token, so almost every e2e
test needs the picker.

## Checklist

- [x] Headless UI `Dialog` `#token-picker` open when `pickerSideAtom` set; Escape / backdrop / ✕ close without changes
- [x] `Combobox` (static, always open) with `#token-search` (autofocus, label "Search tokens"); case-insensitive symbol filter
- [x] Options `.token-option#token-option-<SYMBOL>`: `TokenIcon`, symbol, and when the token has a balance `.token-balance` = `formatAmount(balance)`
- [x] Connected: "Your tokens" (balance > 0) then "All tokens" (the rest); each symbol once
- [x] Selecting → `pickTokenAtom(side, symbol)` (dialog closes)
- [x] No match: `#token-empty` "No results found for <query>"
- [x] Bottom sheet under 480px; list scrolls inside the dialog

## e2e

`pnpm test:e2e -g "token picker|picker lists"`; then `setup()`-based suites unblock.

## Handoff notes

Files: `components/TokenPicker.tsx`, `components/TokenOption.tsx`; `<TokenPicker />` in SwapCard slot.
Notes: Combobox is `value={null}` (selection never persists; pickTokenAtom closes the dialog). Query resets on close/pick. Empty state sits outside the options list. e2e `token picker|picker lists`: 4 passed.
