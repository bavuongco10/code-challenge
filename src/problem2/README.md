# Pixel Swap (Problem 2)

A currency swap form with an 8-bit NES look. Pick two tokens, type an amount on either side,
and the other side is computed from live prices. Brief: [`.problem/problem.md`](.problem/problem.md).

Live demo: https://bavuongco10.github.io/code-challenge/

## Features

- Sell / Buy panels. Either side can be typed (exact in or exact out), with USD values
- Token picker with search, keyboard support and a "Your tokens" section
- Flip button, an invertible rate line, details (fee, slippage, minimum received) and settings
- Wallet: connect, balances, 25/50/75/Max, insufficient-balance checks, review → confirm → toasts, trade log
- Loading and error states for prices, with Retry
- Demo wallet: a fake wallet stored in localStorage, so the whole flow works with no setup
- Guided tour on first visit (replay with the header `?` button)

### Bonus: real Sepolia testnet mode

This goes beyond the brief and is optional. The core form above is complete without it.
Switch the wallet mode in the header to use a real testnet wallet: connect with Reown AppKit
(browser wallets, WalletConnect QR, Coinbase), get on-chain Uniswap V3 quotes, approve + swap,
stay pending until mined, and follow Etherscan links. Tokens: ETH, WETH, USDC, UNI.
All chain code lives in `src/features/swap/sepolia/` and is lazy-loaded with `import()`, so
Demo mode never downloads it.

Full rules and edge cases: [`docs/features/swap/plan.md`](docs/features/swap/plan.md).

## Stack

React 19, TypeScript, Vite 8, Jotai + TanStack Query, Tailwind CSS 4, Headless UI, react-joyride,
wagmi 3 + viem + Reown AppKit (Sepolia mode only, lazy-loaded), Vitest, Playwright, oxlint, Prettier. Package manager is pnpm, Node version is in `.nvmrc`.

## Getting started

```sh
cd src/problem2
nvm use
pnpm install  # also enables the pre-commit hook
pnpm dev
```

### Sepolia mode (optional)

Demo mode needs no setup. For Sepolia, copy `.env.example` to `.env.local` and fill in:

| Variable                | What                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| `VITE_REOWN_PROJECT_ID` | Project id from [cloud.reown.com](https://cloud.reown.com); falls back to a built-in dev id |
| `VITE_SEPOLIA_RPC_URL`  | Sepolia RPC URL; falls back to wagmi's public RPC                                           |

Both ship in the bundle, so they must be public values. Get test ETH from a
[Sepolia faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) (linked in
the account menu too).

## Scripts

| Command                | What it does                             |
| ---------------------- | ---------------------------------------- |
| `pnpm dev`             | Dev server                               |
| `pnpm build`           | Typecheck and production build           |
| `pnpm preview`         | Serve the build                          |
| `pnpm check`           | Typecheck + lint + format check          |
| `pnpm exec vitest run` | Unit tests (`pnpm test` runs watch mode) |
| `pnpm test:e2e`        | Playwright e2e tests (`e2e/`, offline)   |
| `pnpm format`          | Format with Prettier                     |

## Project layout

Code is grouped by feature under `src/features/<feature>/`. Shared code lives in `src/shared/`,
and the app shell is in `src/app/`. Conventions are in [`AGENTS.md`](AGENTS.md), design
decisions in [`docs/adr/`](docs/adr/), and the build plans in
[`docs/features/swap/impl/`](docs/features/swap/impl/README.md) (phase 1) and
[`phase2-sepolia.md`](docs/features/swap/impl/phase2-sepolia.md) (phase 2). Chain-specific code
lives in `src/features/swap/sepolia/` and is loaded with `import()` only when Sepolia mode is on.
The e2e Sepolia spec uses a fake EIP-1193 wallet (`e2e/fakeProvider.ts`) and mocked RPC.

## Non-product files (for reviewers)

These files are part of the development process, not the submission. They are not built or
shipped and can be skipped when reviewing the code:

| Path                                                                                      | What it is                                                                                   |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `.problem/`                                                                               | The original brief and skeleton, kept untouched for reference                                |
| `AGENTS.md`, `CLAUDE.md`, `.agents/`, `.claude/`                                          | Instructions, skills and hooks for AI coding assistants (stack rules, commands, conventions) |
| `docs/features/swap/impl/T00`–`T13`, `automation.md`, `contracts.md`, `phase2-sepolia.md` | Task-by-task build plans and checklists used while building, kept as a record of the process |

The documents worth reading are this README, [`plan.md`](docs/features/swap/plan.md) (the
behaviour spec) and [`docs/adr/`](docs/adr/) (design decisions).

## Deploy

Every push to `main` deploys to GitHub Pages through `.github/workflows/deploy-problem2.yml`
(at the repo root).
