# T01 — Parse, format, convert

Status: done
Depends: – (types from T00 can be stubbed locally; import from `../types.ts` once T00 merges)
Owns: `src/features/swap/lib/{amount,format,convert}.ts` + `.test.ts` for each
Read: `../plan.md` (Amount input, Settings, Number formatting, Details), `contracts.md` (Pure functions)

## Goal

All number rules as pure, unit-tested functions. No React, no atoms.

## Checklist

- [x] `sanitizeAmount`: drop non `[0-9.,]`, `,`→`.`, keep first `.`, ≤ 8 decimals, keep leading zeros and `.5`
- [x] `sanitizeSlippage(prev, raw)`: digits + one `.`, ≤ 2 decimals, return `prev` if the result > 100
- [x] `sanitizeDeadline`: digits only (`1.5`→`15`), clamp to 4320
- [x] `toNumber`: `""`/`"."` → 0
- [x] `formatAmount`: ≤ 6 significant digits, no separators, never exponent (`0.00000016`, `2000000000`, `0.617284`)
- [x] `formatUsd`: `$0` for 0, `<$0.01`, `$1,234.56` below 1M, compact ≥ 1M with 2 decimals (`$2.00B`, `$76.27M`)
- [x] `formatPercent`: `0.5%`, `1%`, `5.51%`
- [x] `formatRate(quote, inverted, prices)`: `1 ETH = 2000 USDC ($2,000.00)`; inverted `1 USDC = 0.0005 ETH ($1.00)`
- [x] `shortAddress`: first 6 + `...` + last 4
- [x] `convert`, `minReceived` (`2000, 0.5` → `1990`)
- [x] Tests cover every example in `../plan.md` and the e2e expectations listed in the spec comments

## Verify

`pnpm exec vitest run src/features/swap/lib` green; `pnpm check`.

## Handoff notes

- Done: `lib/{amount,format,convert}.ts` + tests (37 tests green; oxlint, prettier, tsc clean for lib). Imports `MAX_DEADLINE` and `Quote`/`Prices` from T00's files.
- Deviations from plan/contracts: none. `formatUsd` below 1M uses Intl currency; `formatRate` falls back to `$0` if the sell-side price is missing from `prices`.
- Requests to other tasks: none
- e2e: not run (no UI yet)
- Follow-ups: `formatAmount` rounds to 6 significant digits (1234567.89 -> 1234570). Full `pnpm check` not run (T00 in progress).
