# T00 — App shell, theme, fonts

Status: done
Depends: –
Owns: `index.html`, `src/main.tsx`, `src/index.css`, `src/app/App.tsx`, `src/features/swap/{index.ts,types.ts,constants.ts}`,
`src/features/swap/components/SwapCard.tsx` (placeholder only, T05 takes it over); deletes `src/App.tsx`, `src/App.css`, `src/assets/*`
Read: `design.md` (Palette, Type, Pixel primitives), `contracts.md` (Files, Types, Constants, Slots)

## Goal

Replace the Vite starter with the 8-bit shell every other task builds on: theme tokens, pixel
utilities, fonts, the shared types/constants, and slot placeholders.

## Checklist

- [x] `index.html`: title `Pixel Swap`, Google Fonts `Press Start 2P` + `VT323` (preconnect + `display=swap`), pixel favicon
- [x] Delete `src/App.tsx`, `src/App.css`, `src/assets/`; `main.tsx` imports `./app/App.tsx` and `./index.css`
- [x] `index.css`: `@import "tailwindcss";` + `@theme` colour tokens + fonts (`--font-pixel`, `--font-mono`)
- [x] Dark tokens via `@media (prefers-color-scheme: dark)` overriding the CSS variables the `@theme` tokens point at
- [x] `@utility` blocks: `pixel-box`, `pixel-inset`, `pixel-btn`, `pixel-focus`, `pixel-steps`
- [x] Scanline page background; off under `prefers-contrast: more`; all animation off under `prefers-reduced-motion`
- [x] Contrast-check every text/background pair in both modes; adjust hex + update `design.md` table if needed
- [x] `types.ts` and `constants.ts` exactly as `contracts.md`
- [x] `App.tsx`: header bar with coin logo + "Pixel Swap" title and `{/* slot: T06 header */}`; `<main>` with `<SwapCard />`
- [x] `SwapCard.tsx` placeholder: card frame (`pixel-box`, max-w 480px) with "Swap" title and every slot comment from `contracts.md` in layout order
- [x] `index.ts` exports `SwapCard` (and `WalletHeader` once T06 lands: leave a comment)
- [x] Remove the AGENTS.md TODO about the flat starter (it is now done)

## Verify

`pnpm check`, `pnpm build`, `pnpm dev` → empty pixel card in light + dark, 375px wide with no
horizontal scroll. No e2e passes yet (expected).

## Handoff notes

- Done: shell (`app/App.tsx`, `main.tsx`), `index.css` (tokens, dark overrides, 5 pixel utilities, scanlines, contrast/motion media), `index.html` (title, fonts), pixel coin favicon, `types.ts`, `constants.ts`, placeholder `SwapCard.tsx` with all slot comments, `index.ts`; deleted starter `App.tsx`, `App.css`, `assets/*`; removed AGENTS.md TODO.
- Deviations from plan/contracts: none in contracts. Palette hex changed for AA contrast (design.md table updated): light `muted` #4f647d, `success` #1b7040, `warn` #a8421a; dark `primary` #5db8ff, `warn` #ff9168, `danger` #ff8a9b. Note `success`/`warn`/`danger` are text colours: put `text-panel`/white on them in light mode, `text-paper` (dark ink) in dark mode; `ink` on `primary`/`danger` fails in light, so use white text on those buttons in light and `paper` in dark.
- Requests to other tasks: none. T06 must add `WalletHeader` export to `index.ts` and replace the slot in `App.tsx`.
- e2e: none expected for T00.
- Follow-ups: `pnpm check`/`build` pass for T00 files; in the shared tree, T03's in-progress `walletAtoms.ts` (+ test) currently fails tsc/prettier/oxlint, so verified in a temp copy without those two files. Dark `ink` on `accent` is poor (1.34): use `#1a1c2c` literal-free approach, e.g. `text-shadow`-free `text-black` on accent chips.
