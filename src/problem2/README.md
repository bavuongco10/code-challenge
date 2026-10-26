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
- Demo wallet: a fake wallet stored in localStorage
- Guided tour on first visit (replay with the header `?` button)

Full rules and edge cases: [`docs/features/swap/plan.md`](docs/features/swap/plan.md).

## Stack

React 19, TypeScript, Vite 8, Jotai + TanStack Query, Tailwind CSS 4, Headless UI, react-joyride,
Vitest, Playwright, oxlint, Prettier. Package manager is pnpm, Node version is in `.nvmrc`.

## Getting started

```sh
cd src/problem2
nvm use
pnpm install  # also enables the pre-commit hook
pnpm dev
```

## Scripts

| Command                | What it does                             |
| ---------------------- | ---------------------------------------- |
| `pnpm dev`             | Dev server                               |
| `pnpm build`           | Typecheck and production build           |
| `pnpm preview`         | Serve the build                          |
| `pnpm check`           | Typecheck + lint + format check          |
| `pnpm exec vitest run` | Unit tests (`pnpm test` runs watch mode) |
| `pnpm test:e2e`        | Playwright e2e tests (`e2e/`)            |
| `pnpm format`          | Format with Prettier                     |

## Project layout

Code is grouped by feature under `src/features/<feature>/`. Shared code lives in `src/shared/`,
and the app shell is in `src/app/`. Conventions are in [`AGENTS.md`](AGENTS.md), design
decisions in [`docs/adr/`](docs/adr/), and the build plan in
[`docs/features/swap/impl/`](docs/features/swap/impl/README.md).

## Deploy

Every push to `main` deploys to GitHub Pages through `.github/workflows/deploy-problem2.yml`
(at the repo root).
