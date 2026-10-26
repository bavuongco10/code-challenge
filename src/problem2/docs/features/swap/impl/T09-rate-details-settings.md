# T09 — Rate, expandable details, settings

Status: done
Depends: T04, T05
Owns: `src/features/swap/components/{RateDetails,SettingsPopover}.tsx`; slots `T09 settings gear`, `T09 rate + details` in `SwapCard.tsx`
Read: `../plan.md` (Features 5–7, Details, Settings), UI contract rows Rate … Deadline

## Checklist

- [x] `#rate` button, text exactly `formatRate(...)`; click toggles local inverted state + `.is-inverted`; only rendered with a quote
- [x] `#details-toggle` chevron button (`aria-expanded`, `aria-controls="swap-details"`, label "Show details"); collapsed by default; only with a quote (Headless UI `Disclosure` fits)
- [x] `#swap-details` rows: Fee `#detail-fee.is-free` "Free"; `#detail-slippage` with `.slippage-auto` tag (Auto only) + `.slippage-value`; `#detail-min-received` exactly `formatAmount(min) + " " + symbol`
- [x] `#settings-toggle` gear (`aria-label="Settings"`): `.is-high`/`.is-very-high` from `slippageLevelAtom`; `.slippage-badge` with `formatPercent` only when custom
- [x] `#settings-panel`: Headless UI `Popover` (Escape + outside click close)
- [x] Slippage: `#slippage-auto` (`.is-active` when Auto), `#slippage-input` placeholder `0.5`, `onChange` via `sanitizeSlippage(prev, raw)`, blur with `""`/0 → `""`
- [x] `#slippage-warning` "High slippage" / "Very high slippage" with level class; input `aria-describedby="slippage-warning"` only while shown
- [x] Deadline: `#deadline-input` (`inputmode="numeric"`) via `sanitizeDeadline`; blur `""`/0 → `30`; `#deadline-warning` "High deadline" at ≥ 60, linked via `aria-describedby`

## e2e

`pnpm test:e2e -g "expandable details|settings: max slippage|settings: swap deadline|rate"`

## Handoff notes

- Files: RateDetails.tsx (Headless UI Disclosure; chevron is text glyph, aria-hidden), SettingsPopover.tsx (Popover). Slots filled in SwapCard.
- e2e filter: 27/27 passed. `pnpm check` fails only on others' files (T10-submit-prices.md, swapFlow.ts prettier); mine clean.
