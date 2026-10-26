# T02 — Prices fetch + cleanup

Status: done
Depends: –
Owns: `src/features/swap/api/fetchPrices.ts`, `src/features/swap/api/fetchPrices.test.ts`
Read: `../plan.md` (External data, Gotchas), `contracts.md` (Pure functions), `e2e/helpers.ts` (`PRICES` fixture)

## Goal

Fetch `prices.json` once and turn it into `Prices` (symbol → USD).

## Checklist

- [x] `parsePrices(json: unknown)`: validate shape without `any`; non-array throws
- [x] Duplicates: the entry with the latest `date` wins (USDC 0.5 older vs 1 newer → 1)
- [x] Drops entries whose `price` is missing, non-finite or ≤ 0 (`NOPRICE`)
- [x] `fetchPrices(signal)`: plain `fetch(PRICES_URL)`, throws on `!res.ok` (status 500 → error state upstream)
- [x] Tests use `vi.stubGlobal('fetch', …)`, never the real URL; include the e2e `PRICES` fixture as a case

## Verify

`pnpm exec vitest run src/features/swap/api`; `pnpm check`.

## Handoff notes

- Done: `parsePrices` (latest date wins, drops missing/non-finite/<=0/malformed) and `fetchPrices(signal?)` in `api/fetchPrices.ts`; 6 tests incl. e2e PRICES fixture, fetch stubbed.
- Deviations from plan/contracts: none. Imports `Prices`/`PRICES_URL` from T00 files. Entries with unparseable `date` lose to any dated entry.
- Requests to other tasks: none
- e2e: not run (UI not built yet)
- Follow-ups: none
