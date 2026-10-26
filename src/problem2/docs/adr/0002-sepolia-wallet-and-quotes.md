# 0002. Sepolia wallet: wagmi 3 + Reown AppKit, Uniswap V3 quotes

- Status: Proposed
- Date: 2026-10-27

## Context

Phase 2 turns the `Sepolia` wallet mode into a real testnet wallet (see
`docs/features/swap/plan.md` → Sepolia wallet). It needs a wallet connection UI, chain reads and
writes, a quote source the chain will honour, and a contract that executes the swap.
Repo rules: Jotai for state, TanStack Query for server data, Headless UI as the only component
library. We want the latest wagmi (3) on React 19.

Connect-kit peers checked on npm 2026-10-27: ConnectKit 1.9, RainbowKit 2.2, OnchainKit 1.1,
Dynamic 5.12 and Family 0.1 all pin `wagmi@2`. Reown AppKit 1.8.24 (`wagmi >=2.19.5`) and
Privy (hosted auth, overkill) accept wagmi 3.

## Decision

- **Wallet stack: wagmi 3 + viem 2 + Reown AppKit 1.8** (`@reown/appkit`,
  `@reown/appkit-adapter-wagmi`). AppKit gives the connect modal (injected/EIP-6963,
  WalletConnect QR + mobile deep links, Coinbase), network switching and an account view.
  - Exception to "Headless UI only": the AppKit modal is the one other UI library allowed,
    and only for wallet connection. Themed with `themeMode: "dark"` + `themeVariables`.
  - Upsells off: `features: { email: false, socials: [], swaps: false, onramp: false,
analytics: false }`. Our swap card is the swap; AppKit is only the wallet door.
- **One QueryClient.** `src/app` creates it once and passes it to both `QueryClientProvider`
  (wagmi) and Jotai (`queryClientAtom`), so wagmi and prices share one cache.
- **Jotai stays the source of truth.** No wagmi/AppKit hooks in components. `createAppKit`
  returns a `modal` instance; atoms call `modal.open()` / `modal.open({ view: "Networks" })`.
  Account/chain flow into atoms via `watchConnection` from `wagmi/actions`; reads and writes
  (`readContracts`, `writeContract`, `switchChain`, `waitForTransactionReceipt`) run inside
  atoms against `wagmiAdapter.wagmiConfig`.
- **Chain: Sepolia (11155111) only**, from `@reown/appkit/networks`. `defaultNetwork: sepolia`,
  `allowUnsupportedChain: false` so AppKit prompts a switch. Transport
  `http(VITE_SEPOLIA_RPC_URL)`, falling back to the network's default RPC.
- **Quotes: on-chain Uniswap V3 `QuoterV2`** (`quoteExactInputSingle` / `quoteExactOutputSingle`),
  single hop, best of fee tiers 500 / 3000 / 10000. prices.json is used only for USD values.
- **Execution: Uniswap V3 `SwapRouter02`** via `multicall(deadline, data[])`
  (`exactInputSingle` / `exactOutputSingle`, plus `refundETH` / `unwrapWETH9` for native ETH).
  ERC-20 sells need an `approve` of the exact amount first.
- **Units: bigint base units** for every Sepolia balance and amount; `formatUnits` only for display.

## Consequences

- New dependencies: `wagmi`, `viem`, `@reown/appkit`, `@reown/appkit-adapter-wagmi`
  (asked for by the product owner: a ready-made multi-wallet connect UI on the latest wagmi).
  AppKit is heavy (web components + WalletConnect); everything Sepolia is lazy-loaded
  (`import()` on mode switch) so demo mode doesn't pay for it.
- `VITE_REOWN_PROJECT_ID` (dashboard.reown.com) is required. It is public by design and ships in
  the bundle; set its allowed domains to `localhost` and the GitHub Pages domain. AppKit
  `metadata.url` must match the page origin.
- AppKit's modal is a web component styled with Lit; it can't be made fully pixel/NES. We theme
  colours, font and radius and accept the rest.
- AppKit calls Reown's API (wallet list, explorer images, RPC relay). The app is no longer
  fully self-contained in Sepolia mode; demo mode makes no such calls.
- Sepolia mode uses a short hand-picked token list; most prices.json symbols don't exist on Sepolia.
- Sepolia pools have thin, arbitrary liquidity: on-chain rates can be far from prices.json USD
  values, and some pairs have no pool. That is expected on a testnet.
