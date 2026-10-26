# T06 — Mode switch, connect, account menu

Status: done
Depends: T03, T04
Owns: `src/features/swap/components/{WalletHeader,WalletModeSwitch,AccountMenu}.tsx`; slot `T06 header` in `src/app/App.tsx`; the `WalletHeader` export in `src/features/swap/index.ts`
Read: `../plan.md` (Mode switch, Connected UI), `design.md` (Layout header), `e2e/wallet.spec.ts`

## Checklist

- [x] `#wallet-mode`: segmented pixel toggle with `[data-mode=demo]` / `[data-mode=sepolia]` buttons; active gets `.is-active` + `aria-pressed`; Sepolia `disabled` with tooltip "Coming soon" (`title` + visible on focus)
- [x] Disconnected: `#connect-wallet` pixel button with wallet icon → `connectAtom`
- [x] Connected: `#account-button` text exactly `shortAddress(address)` (icon is SVG, no extra text)
- [x] `#account-menu`: Headless UI `Popover`; full address, `#disconnect`, "Recent activity" `#activity` list of `.activity-item` (max 5, newest first: `Swapped` · `1 ETH → 2000 USDC` · relative time via `Intl.RelativeTimeFormat`)
- [x] Empty activity state ("No swaps yet")
- [x] Mobile: wraps to two rows (design.md)

## e2e

`pnpm test:e2e -g "wallet mode switch|connect / disconnect"` (needs T08 for `setup`; until then check by hand)

## Handoff notes

Done. `<WalletHeader/>` renders as `display: contents` inside App's flex-wrap header; under 480px the mode switch gets `order-3 w-full` and wraps to row 2. Sepolia tooltip sits on a focusable wrapper span (disabled buttons can't take focus). Verified by hand in headless Playwright at 400px: mode switch, connect, account text, menu, activity, disconnect. e2e specs not run (need T08).
