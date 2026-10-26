# Swap phase 2: Sepolia wallet, implementation plan

Status: planned. Turns the disabled `Sepolia` wallet mode into a real testnet wallet that
connects with Reown AppKit (wagmi 3) and quotes and swaps on Uniswap V3 on Sepolia. Target
behaviour: [`../plan.md`](../plan.md) → Sepolia wallet. Tech decisions:
[ADR 0002](../../../adr/0002-sepolia-wallet-and-quotes.md). Same protocol as phase 1
([`README.md`](README.md) → Protocol, Definition of done).

## Scope

In: Reown AppKit modal (browser wallets, WalletConnect QR/mobile, Coinbase), Sepolia only,
single-hop Uniswap V3 swaps between a few known tokens, on-chain quotes, real balances,
approve + swap, pending until mined.

Out (ponytail, add when asked): mainnet or other chains, multi-hop routes, Permit2 /
UniversalRouter, gas price settings, tx history from an indexer, SIWE, AppKit email/social
login, swaps and on-ramp (all switched off).

## Dependencies (S00)

| Package                       | Version | Why                                                      |
| ----------------------------- | ------- | -------------------------------------------------------- |
| `@reown/appkit`               | `^1.8`  | Connect modal, wallet list, network switch, account view |
| `@reown/appkit-adapter-wagmi` | `^1.8`  | Bridges AppKit to wagmi (peer `wagmi >=2.19.5`)          |
| `wagmi`                       | `^3`    | Connectors, connection state, actions                    |
| `viem`                        | `^2`    | Transport, ABI encoding, bigint units (wagmi peer)       |

`@tanstack/react-query` is already installed. All peers accept React 19; no overrides.
S00 confirms the adapter really runs on wagmi 3 (dev + build + modal connects MetaMask on
Sepolia) before anything else is built, and adds the AppKit exception to `AGENTS.md`.

`.env.example`: `VITE_REOWN_PROJECT_ID=`, `VITE_SEPOLIA_RPC_URL=` (both public).

## Chain constants (`constants.ts`)

Addresses from the Uniswap v3 Sepolia deployments page. S00 re-checks each on
sepolia.etherscan.io before merging (USDC and UNI especially).

| Name               | Address                                      |
| ------------------ | -------------------------------------------- |
| `SEPOLIA_CHAIN_ID` | `11155111` (`0xaa36a7`)                      |
| QuoterV2           | `0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3` |
| SwapRouter02       | `0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E` |
| UniswapV3Factory   | `0x0227628f3F023bb0B980b67D528571c95c6DaC1c` |
| WETH               | `0xfff9976782d46cc05630d1f6ebab18b2324d6b14` |
| USDC (Circle)      | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |
| UNI                | `0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984` |

Token list `SEPOLIA_TOKENS: { symbol, address | "native", decimals }[]` = ETH (native, 18),
WETH (18), USDC (6), UNI (18). USD values still come from prices.json by symbol (WETH uses the
ETH price). A symbol with no price shows `$0`.

## Behaviour changes vs phase 1

Additions to `../plan.md`; S07 moves them there when it ships.

- `#wallet-mode` `Sepolia` is enabled; the "Coming soon" tooltip goes.
- In Sepolia mode the picker lists only `SEPOLIA_TOKENS`. Switching mode resets any token
  that isn't in the new list (sell back to ETH, buy to none).
- Connect: `#connect-wallet` (and submit in `is-connect`) calls `modal.open()`. AppKit handles
  "no wallet installed" (All wallets / Get a wallet), QR for mobile, and user rejection.
- `#account-button` keeps our pixel style and opens our `#account-menu`; `#disconnect` calls
  wagmi `disconnect`. wagmi reconnects on reload from its own storage. The menu also has
  "Manage wallet" → `modal.open({ view: "Account" })`.
- Account or chain changed in the wallet: balances and quote refetch. No account = disconnected.
- New submit states, checked right after `is-connect`:

  | Condition                 | Class            | Label                        |
  | ------------------------- | ---------------- | ---------------------------- |
  | Wallet on another chain   | `is-wrong-chain` | `Switch to Sepolia`          |
  | Quote in flight           | `is-quoting`     | `Fetching quote…`            |
  | No pool / quoter reverted | `is-no-route`    | `No liquidity for this pair` |

  `is-wrong-chain` is enabled and calls `switchChain`; refusal → error toast "Failed to switch
  networks — switch to Sepolia in your wallet's settings."

- The non-typed side shows the on-chain quote, not prices.json math. Quotes are debounced
  300 ms and refreshed every 15 s while the review dialog is open.
- Gas reserve: Max on ETH keeps `GAS_RESERVE = 0.002 ETH` back. If sell ETH + reserve > balance,
  or ETH balance < reserve for an ERC-20 sell, state is `is-insufficient` ("Not enough ETH")
  and `#gas-banner` reads "Not enough ETH on Sepolia to swap".
- Review adds `#review-network-cost`: `estimateGas × maxFeePerGas`, shown `<0.001 ETH`
  below that, else 3 significant digits.
- Confirm order: chain check again (same switch + toast; dialog stays open) → `approve` exact
  amount if the ERC-20 allowance is short (button: "Approve USDC in wallet") → swap tx →
  dialog closes.
- Pending toast lasts until `waitForTransactionReceipt`. Success and error toasts get a
  "View on Etherscan" link (`#swap-toast-tx`). Reverted receipt → `is-error` toast
  "Swap failed". Rejected signature → dialog stays open, no toast.
- Activity is stored per address in `swap:sepoliaActivity:<address>` (same shape + `hash`).
  Balances are never stored; they come from the chain.
- Header shows a `TESTNET` badge (`#testnet-badge`); the account menu says
  "You are in testnet mode" and links to a Sepolia faucet.

## Architecture

```
src/app/
  App.tsx                        one QueryClient → QueryClientProvider + Jotai queryClientAtom
  WalletProviders.tsx            WagmiProvider once the lazy appKit module has loaded
src/features/swap/
  sepolia/                       new; everything chain-specific lives here, loaded via import()
    appKit.ts                    WagmiAdapter({ networks: [sepolia], projectId, transports })
                                 + createAppKit({ adapters, networks, defaultNetwork, metadata,
                                 features: off, themeMode: "dark", themeVariables }) → modal
    abis.ts                      QuoterV2, SwapRouter02, ERC-20, WETH subsets (as const)
    tokens.ts (+ .test.ts)       SEPOLIA_TOKENS, units helpers, gas-reserve math
    sepoliaWalletAtoms.ts        connection/chain atom fed by watchConnection; open/disconnect/switch
    sepoliaQueryAtoms.ts         balances + quote + allowance + gas as atomWithQuery (readContracts)
    buildSwap.ts (+ .test.ts)    pure: quote + settings → router multicall args
    sepoliaSwapFlow.ts           confirm: switch → approve → write → wait → toast
  walletAtoms.ts                 mode-aware facade: same exported atom names as phase 1
```

- **One facade, two backends.** Components keep reading `connectedAtom`, `balancesAtom`,
  `connectAtom`, `quoteAtom`, `confirmSwapAtom`. Each picks demo or Sepolia by
  `walletModeAtom`. No component imports wagmi or AppKit; atoms open the modal through the
  `modal` instance `createAppKit` returns.
- `sepolia/appKit.ts` is imported only when the mode becomes `sepolia` (or is `sepolia` on
  load). `createAppKit` runs once, at module level. Until then `WalletProviders` renders
  children without `WagmiProvider`, so demo first paint and bundle stay as today.
- AppKit options: `defaultNetwork: sepolia`, `allowUnsupportedChain: false`,
  `features: { email: false, socials: [], swaps: false, onramp: false, analytics: false }`,
  `metadata.url = window.location.origin` (must match the Reown allow-list).
- Theme (`themeVariables`): `--w3m-font-family` = the pixel font, `--w3m-accent` = NES accent,
  `--w3m-border-radius-master: 0px`, `--w3m-z-index` above our dialogs.
- `Quote` gains `sellRaw` / `buyRaw: bigint` and `fee?: number`; demo fills raw values from
  its numbers so the shape is shared. Display numbers stay `number` (6 sig digits).
- Router call (`buildSwap.ts`): `multicall(deadline, [...])` on SwapRouter02
  - ETH → token: `exactInputSingle({ tokenIn: WETH, ... })` with `value`; exact-out adds `refundETH()`
  - token → ETH: recipient = router (`ADDRESS_THIS`), then `unwrapWETH9(amountOutMin, user)`
  - token → token: plain `exactInputSingle` / `exactOutputSingle`
  - slippage: exact-in `amountOutMinimum = out × (1 − s)`, exact-out `amountInMaximum = in × (1 + s)`,
    bigint math in basis points. Deadline = now + settings minutes.
  - ETH ↔ WETH is a wrap/unwrap (`deposit` / `withdraw` on WETH), not a pool swap.
- Fee tier: quote 500, 3000 and 10000 in parallel (`Promise.allSettled`), keep the best;
  the tier is carried in the quote and reused for the swap.

## Tasks

| Task | Title                                                                         | Depends  | Owns                                                                  |
| ---- | ----------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------- |
| S00  | Accept ADR, add deps, wagmi 3 smoke test, env, constants, AGENTS.md exception | –        | `package.json`, `.env.example`, `constants.ts`, `types.ts`, AGENTS.md |
| S01  | Tokens + units + gas reserve (pure, tested)                                   | S00      | `sepolia/tokens.ts`                                                   |
| S02  | AppKit + wagmi config, providers, theme, connection atoms                     | S00      | `sepolia/appKit.ts`, `sepolia/sepoliaWalletAtoms.ts`, `src/app/*`     |
| S03  | Balances, quote, allowance, gas query atoms                                   | S01, S02 | `sepolia/abis.ts`, `sepolia/sepoliaQueryAtoms.ts`                     |
| S04  | `buildSwap` args (pure, tested)                                               | S01      | `sepolia/buildSwap.ts`                                                |
| S05  | Mode-aware facade + new submit states                                         | S02, S03 | `walletAtoms.ts`, `atoms.ts`                                          |
| S06  | Confirm flow: switch → approve → swap → receipt → toast                       | S04, S05 | `sepolia/sepoliaSwapFlow.ts`, `swapFlow.ts`                           |
| S07  | UI: enable switch, connect wiring, badge, menu, gas banner, cost, tx link     | S05      | `components/*` touched; `../plan.md`                                  |
| S08  | e2e with a fake injected provider, `pnpm verify` loop                         | S06, S07 | `e2e/sepolia.spec.ts`, `e2e/fakeProvider.ts`                          |
| S09  | Manual test on real Sepolia (MetaMask + one WalletConnect mobile)             | S08      | report only                                                           |

Waves: S00 → (S01, S02) → (S03, S04) → S05 → (S06, S07) → S08 → S09.

## Testing

- Unit (Vitest, `node`): units/reserve math, `buildSwap` per route × exact-in/out (encode with
  viem, decode with `decodeFunctionData`, assert args), fee-tier pick, facade switching with
  `createStore()`. Stub the wagmi actions with `vi.mock("wagmi/actions")` and the `modal`
  instance; tests never hit an RPC or Reown.
- e2e: `page.addInitScript` installs a fake EIP-1193 provider (`e2e/fakeProvider.ts`) that
  announces itself via EIP-6963 and answers `eth_requestAccounts`, `eth_chainId`,
  `wallet_switchEthereumChain` (scriptable reject), `eth_sendTransaction` (returns a hash);
  `page.route` on the RPC URL answers `eth_call` / `eth_getBalance` /
  `eth_getTransactionReceipt` with canned results. The test picks the fake wallet in the
  AppKit modal by its announced name (the modal is a shadow-DOM web component; Playwright
  locators pierce open shadow roots). Reown/WalletConnect hosts are routed to empty 200s so
  tests stay offline. Covers: connect, wrong chain refused, no route, gas banner, approve
  then swap, pending → success. Phase 1 specs stay untouched and must still pass (demo is
  the default mode).
- Manual (S09), with a funded Sepolia account (faucet + Circle USDC faucet):
  ETH→USDC exact-in, USDC→ETH exact-out (approve path), ETH↔WETH wrap, Max with reserve,
  reject signature, wrong chain, account switch mid-session, reload while pending, connect from
  a phone via WalletConnect QR.

## Risks

- **AppKit on wagmi 3:** the peer range allows it, but Reown's install docs still show
  `wagmi@2.x`. If S00's smoke test fails, pin `wagmi@2.19`; the plan is otherwise unchanged
  (wagmi 2 names: `watchAccount` / `getAccount` instead of `watchConnection` / `getConnection`).
- **Style clash:** AppKit's modal can't be fully pixel-styled; theme variables get colours,
  font and radius close to NES. Accept the rest.
- **Reown dependency:** a wrong/unrestricted project id or a Reown outage breaks the modal's
  wallet list and WalletConnect. Injected wallets still connect (EIP-6963 is local).
- Sepolia pool liquidity is thin and changes: rates can be wild, pools can vanish. The
  `is-no-route` state and min-received check are the guard; the token list stays tiny.
- Public RPC rate limits: one `readContracts` multicall for balances, debounced quotes, no
  block polling (refetch after our own tx and on account/chain events only).
- Reload while pending: the hash is in the activity entry with `status: "pending"`; on load,
  pending entries are re-awaited and the toast is restored.
