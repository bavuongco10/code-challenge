# T03 — Demo wallet storage + atoms

Status: done
Depends: – (types/constants from T00; stub locally if T00 isn't merged)
Owns: `src/features/swap/walletAtoms.ts`, `src/features/swap/walletAtoms.test.ts`
Read: `../plan.md` (Wallet → Mode switch, Demo wallet), `contracts.md` (Atoms → Wallet), `e2e/wallet.spec.ts`

## Goal

Phase 1 wallet as Jotai atoms persisted in localStorage. Sepolia (phase 2) is out of scope;
just keep `walletModeAtom` so the switch exists.

## Checklist

- [x] `walletModeAtom` via `atomWithStorage(WALLET_MODE_KEY, "demo", …, { getOnInit: true })`; nothing written until changed
- [x] `walletAtom` via `atomWithStorage` with a custom storage whose `getItem` returns the default on bad JSON or wrong shape (never throws)
- [x] `connectAtom`: null → `{ connected: true, address: DEMO_ADDRESS, balances: DEMO_BALANCES, activity: [] }`; otherwise just `connected: true`
- [x] `disconnectAtom`: `connected: false`, balances + activity kept
- [x] Changing `walletModeAtom` disconnects
- [x] `balancesAtom`: numbers, missing symbol = 0; `null` when disconnected
- [x] `applySwapAtom(activity)`: re-checks sell balance; if too low returns false and changes nothing; else subtracts/adds, exact bigint maths in 8-decimal units, prepends activity
- [x] Tests with `createStore()` and a stubbed `localStorage` (Vitest `node` env has none): defaults, corrupt JSON, disconnect keeps data, swap math, too-low swap rejected

## Verify

`pnpm exec vitest run src/features/swap/walletAtoms.test.ts`; `pnpm check`.

## Handoff notes

- Done: `walletAtoms.ts` (walletModeAtom, walletAtom, connectedAtom, balancesAtom, connectAtom, disconnectAtom, applySwapAtom) + 7 tests; tsc, oxlint, prettier clean.
- Deviations from plan/contracts: `walletModeAtom` is a write-wrapper over a private storage atom so a mode change also disconnects (same read/write API). `balancesAtom` returns a Proxy so any missing symbol reads 0.
- Requests to other tasks: none
- e2e: not run (needs UI tasks)
- Follow-ups: `applySwapAtom` also returns false when disconnected or amount <= 0.
