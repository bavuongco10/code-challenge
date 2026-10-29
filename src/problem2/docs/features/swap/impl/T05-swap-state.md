# T05 — Swap atoms + SwapCard slots

Status: done
Depends: T01, T02, T03
Owns: `src/features/swap/atoms.ts`, `src/features/swap/atoms.test.ts`, `src/features/swap/components/SwapCard.tsx` (takes over from T00: frame + slots only)
Read: `../plan.md` (Rules, Validation, Details, Settings, presets), `contracts.md` (Atoms → Swap)

## Goal

All swap state and rules as atoms, so the UI tasks (T07–T11) only render and call write atoms.

## Checklist

- [x] Prices: `atomWithQuery` over `fetchPrices`; `pricesAtom` derives `loading | error | ready` (no Suspense needed); `retryPricesAtom` refetches via the query client
- [x] `tokensAtom` A→Z from ready prices
- [x] `setAmountAtom` sanitises with `sanitizeAmount`, sets `typedSideAtom`
- [x] `amountsAtom`: the typed side shows raw text; the other side `formatAmount(convert(...))`, `""` if no quote; clearing clears both
- [x] `quoteAtom` null unless both tokens and `toNumber(typed) > 0`
- [x] `pickTokenAtom`: same token as the other side → swap sides; closes picker
- [x] `flipAtom`: swap tokens, typed amount moves with its token (typed side flips)
- [x] `setPresetAtom(p)`: exact bigint `balance × p / 100`, floored to 8 decimals, into sell, exact-in
- [x] Slippage: `slippageAtom` = Auto 0.5 when input `""`/0; `slippageLevelAtom` `>5.5 && <20` high, `≥20` very-high
- [x] `minReceivedAtom` = `minReceived(quote.buyAmount, slippage)`
- [x] `insufficientAtom`: connected and quote.sellAmount > sell balance (works for exact-out)
- [x] `submitStateAtom`: rows in plan order, first match wins
- [x] `resetAmountsAtom`
- [x] Tests (`createStore()`, stub fetch): every Validation row, flip, side swap, presets, exact-out insufficient, min received 1990/1980
- [x] `SwapCard.tsx`: keep the T00 frame and slot comments; nothing else

## Verify

`pnpm exec vitest run src/features/swap`; `pnpm check`.

## Handoff notes

- Files: `atoms.ts`, `atoms.test.ts` (22 tests). `SwapCard.tsx` unchanged: T00's frame + slots already matched the brief.
- Prices: `pricesQueryAtom` is an `atomWithQuery` (`["prices"]`, `retry: false`, `queryFn` gets TanStack's abort `signal`). `pricesAtom` derives `{state}` from it: data → ready, error and not fetching → error, else loading, so retry shows `loading` again. `retryPricesAtom` calls `queryClient.refetchQueries` (the query atom's setter doesn't refetch). Tests give each store its own `QueryClient`.
- `quoteAtom` also returns null while prices aren't ready or a token has no price. Exact-out: `sellAmount = convert(buy, pBuy, pSell)`; `insufficientAtom` uses `quote.sellAmount`.
- `pickTokenAtom` on the other side's token delegates to `flipAtom`, so the typed amount moves with its token the same way it does on flip.
- `setPresetAtom` / `resetAmountsAtom` set `typedSideAtom` back to `sell`.
- Components must subscribe to `pricesAtom` (`useAtomValue`) for the fetch to start; tests do `store.sub(pricesAtom, …)`.
- `reviewOpenAtom`, `toastAtom` are plain primitives for T11.
- Checks: `pnpm check` exit 0; `pnpm exec vitest run` → 6 files, 72 tests passed.
- Requests: none.
