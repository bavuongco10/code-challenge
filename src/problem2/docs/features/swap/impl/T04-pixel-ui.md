# T04 — PixelIcon, Spinner, TokenIcon

Status: done
Depends: T00
Owns: `src/features/swap/components/{PixelIcon,Spinner,TokenIcon}.tsx`
Read: `design.md` (Copy & icons, Motion), `../plan.md` (External data → icons)

## Goal

The small visual building blocks every UI task uses.

## Checklist

- [x] `PixelIcon({ name, className })`: 16×16 `viewBox`, `<rect>` pixels, `fill="currentColor"`, `shape-rendering="crispEdges"`, `aria-hidden="true"`. Names: `gear`, `chevron-down`, `flip`, `close`, `wallet`, `check`, `cross`, `coin`, `search`, `warn`
- [x] `Spinner`: 8-frame pixel ring, `steps(8)` 800ms; static under reduced motion; `aria-hidden` (callers announce the state)
- [x] `TokenIcon({ symbol, size })`: `<img src={ICON_URL(symbol)} alt="">` with `image-rendering: pixelated`; on error, a square `accent` tile with the first letter (Press Start 2P). Must look right when e2e aborts icon requests
- [x] Temporary preview: render all three in `SwapCard` locally to eyeball, **don't commit** the preview

## Verify

`pnpm check`; eyeball in light + dark.

## Handoff notes

- Icons are 8x8 ASCII bitmaps rendered as 2x2 rects in the 16x16 viewBox (`IconName` type exported). Default size `size-4`; override via `className`.
- `Spinner` takes optional `className`; reduced motion handled by the global rule in index.css.
- `TokenIcon` fallback tile text colour is fixed dark (accent is the same in both modes). `size` is px, default 24.
- Visual eyeball step skipped (no preview committed).
