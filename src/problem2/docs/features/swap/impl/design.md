# Design: 8-bit swap

The swap is a retro arcade terminal, dark-first: deep navy page with a faint dot grid, slate
"windows" with thick white pixel borders and hard black drop shadows, cyan as the action
colour, gold for the active/selected thing, warm orange for losses and errors, and lime green
for terminal-style success text. Bitmap fonts, stepped animations. Behaviour is unchanged by
the look: rules live in `../plan.md`.

## Palette

Sampled from the reference mockup. Defined once in `src/index.css` as Tailwind theme tokens.
Components use token classes only (`bg-panel`, `text-ink`, `placeholder:text-dim` …), never raw
hex. Light mode is a derived "paper" version of the same palette.

| Token             | Dark      | Light     | Used for                                                 |
| ----------------- | --------- | --------- | -------------------------------------------------------- |
| `paper`           | `#1a1c2b` | `#e9ecf3` | page background                                          |
| `panel`           | `#272b42` | `#ffffff` | card, dialogs, popovers                                  |
| `well`            | `#1a1c2b` | `#f4f5f9` | amount panels, inputs (inset)                            |
| `raised`          | `#353c55` | `#dde2ec` | disabled submit, inactive tabs, account chip             |
| `ink`             | `#f4f4f4` | `#1a1c2b` | text, input values, pixel borders                        |
| `muted`           | `#9aafc0` | `#4a5a72` | labels, USD values, balances, disabled labels            |
| `dim`             | `#8193ab` | `#5b6c84` | placeholders, timestamps, footnotes                      |
| `line`            | `#717587` | `#6b7186` | secondary borders (inputs inside a panel, dividers)      |
| `shadow`          | `#0b0c13` | `#1a1c2b` | hard drop shadow                                         |
| `primary`         | `#94ecf5` | `#2c4bb0` | primary button, focus ring, links, active segment        |
| `accent`          | `#f7cf82` | `#f7cf82` | logo, flip button, `Auto` tag, selected chip (fill only) |
| `success`         | `#b7ee81` | `#2e6b1f` | success toast, `Free` fee                                |
| `warn`            | `#f7cf82` | `#7a5200` | `is-high` slippage, high deadline, pending toast icon    |
| `danger`          | `#e08360` | `#b2452a` | `is-error`, `is-very-high`, insufficient, error toast    |
| `on-fill`         | `#1a1c2b` | `#ffffff` | text on `primary` / `danger` fills                       |
| `on-accent`       | `#1a1c2b` | `#1a1c2b` | text on `accent` fills                                   |
| `terminal`        | `#0b0c13` | `#0b0c13` | activity log background (dark in both modes)             |
| `on-terminal`     | `#b7ee81` | `#b7ee81` | activity log text                                        |
| `on-terminal-dim` | `#8193ab` | `#8193ab` | activity log timestamps                                  |

Rules:

- `accent` is a **fill only**. Never use `text-accent` (1.5:1 on light panels); for gold text
  use `text-warn`.
- Light `primary` is a deep blue, not cyan: cyan on white is 1.4:1.

## Contrast (WCAG 2.2 AA)

Text needs 4.5:1, non-text UI (borders that identify a control, focus rings) 3:1. Computed from the token values (WCAG relative luminance) for
both schemes:

| Pair                                                | Dark         | Light        |
| --------------------------------------------------- | ------------ | ------------ |
| Amount input value (`ink` / `well`)                 | 15.34        | 15.48        |
| Amount placeholder (`dim` / `well`)                 | 5.38         | 4.91         |
| Insufficient amount (`danger` / `well`)             | 6.09         | 5.10         |
| USD value, balance (`muted` / `well`)               | 7.44         | 6.43         |
| Settings inputs value / placeholder                 | 15.34 / 5.38 | 15.48 / 4.91 |
| Labels on card (`muted` / `panel`)                  | 6.14         | 7.01         |
| Disabled submit label (`muted` / `raised`)          | 4.80         | 5.39         |
| `on-fill` / `primary`                               | 12.51        | 7.66         |
| `on-fill` / `danger`                                | 6.09         | 5.56         |
| `on-accent` / `accent`                              | 11.41        | 11.41        |
| `warn` / `panel`                                    | 9.40         | 6.92         |
| `success` / `panel`                                 | 10.30        | 6.48         |
| Focus ring (`primary`) / `panel`, `well`            | 10.31, 12.51 | 7.66, 7.03   |
| Input border (`line` / `panel`), non-text           | 3.04         | 4.85         |
| Activity timestamp (`on-terminal-dim` / `terminal`) | 6.22         | 6.22         |
| Activity log (`on-terminal` / `terminal`)           | 14.46        | 14.46        |

Any new colour pair must be added here with its ratio. Placeholders count as text (4.5:1),
since they carry the format hint (`0`, `0.5`).

Dark mode follows `prefers-color-scheme` (AGENTS.md); tokens swap, so components need no `dark:`
variants except for rare one-offs.

## Stacking

One z-index scale, so overlays never lose to in-card controls (e.g. the flip button, which
sits `z-10` to overlap the two panels):

| Layer                                          | z               |
| ---------------------------------------------- | --------------- |
| In-card overlap (flip button)                  | `z-10`          |
| Popovers & menus (settings, account, tooltips) | `z-30`          |
| Dialogs (token picker, review)                 | `z-50` (portal) |
| Toast                                          | `z-50`          |

A popover must cover the card content under it, including the flip button.

## Type

Loaded from Google Fonts in `index.html` (no npm dependency):

- **Press Start 2P**: titles, button labels, tabs, tags. Small sizes only: 8, 10, 12, 16px.
  Never below 8px; line-height ≥ 1.6.
- **VT323**: amounts, balances, rates, body text. Amount inputs 40px (32px under 400px wide),
  other text 20–24px.
- Fallback: `ui-monospace, monospace`. `font-synthesis: none`; no anti-aliasing tweaks.

## Pixel primitives (CSS utilities, T00)

Tailwind 4 `@utility` blocks in `src/index.css`, used like normal classes:

| Utility       | What it does                                                                |
| ------------- | --------------------------------------------------------------------------- |
| `pixel-box`   | `border: 4px solid ink`, `border-radius: 0`, `box-shadow: 4px 4px 0 shadow` |
| `pixel-inset` | 4px border + inner hard shadow (`inset 4px 4px 0` darker), for wells/inputs |
| `pixel-btn`   | `pixel-box` + press effect: `:active` moves 4px right/down and drops shadow |
| `pixel-focus` | `:focus-visible` → 4px `primary` outline, offset 2px, square                |
| `pixel-steps` | `transition-timing-function: steps(4)` for all transitions                  |

- Corners stay square everywhere. No `rounded-*`, no blur, no gradients except the dot grid.
- Page background: `paper` with a faint dot grid (1px dots every 24px, ~8% `ink`), like the
  reference. Off under `prefers-contrast: more`.
- Images and icons: `image-rendering: pixelated`; SVG icons use `shape-rendering="crispEdges"`.

## Motion

Everything moves in steps, like sprites. Under `prefers-reduced-motion: reduce`, all of it is
off (instant state changes). Timings never affect behaviour (e2e uses `page.clock`).

- Buttons: press offset (no transition, instant like a real key).
- Dialogs/popovers: open in 3 steps (scale 0.9 → 1, `steps(3)`, 120ms).
- Flip button: icon rotates 180° in 4 steps on click.
- Spinner: an 8-frame pixel ring, `steps(8)`, 800ms per turn.
- Toast: slides in from the bottom in 4 steps; success adds a 2-frame "coin" blink on the icon.
- Hover on the card's coin logo: 2-frame bob.

## Layout

```
┌────────────────────────────────────────────────────────┐
│ [coin] PIXEL SWAP     [DEMO|SEPOLIA]   [▣ 0x1234...5678]│  header
└────────────────────────────────────────────────────────┘
          ┌──────────────────────────────────┐
          │ SWAP                         [⚙]  │  card max-w 480px
          │ ┌──────────────────────────────┐ │
          │ │ SELL          25% 50% 75% MAX│ │  presets on hover/focus
          │ │ 1.5            [◆ ETH ▾]     │ │  VT323 40px
          │ │ $3,000.00          1.5 ETH   │ │  usd left, balance right
          │ └──────────────────────────────┘ │
          │              [⇅]                  │  flip, overlaps both panels
          │ ┌──────────────────────────────┐ │
          │ │ BUY                          │ │
          │ │ 3000           [◆ USDC ▾]    │ │
          │ │ $3,000.00         1000 USDC  │ │
          │ └──────────────────────────────┘ │
          │ 1 ETH = 2000 USDC ($2,000.00) [▾] │  rate + details toggle
          │ ┌ Fee ............... FREE ─────┐ │
          │ │ Max slippage ... AUTO 0.5%    │ │
          │ └ Min received ...... 1990 USDC ┘ │
          │ [          ▶ REVIEW            ] │  full-width primary
          └──────────────────────────────────┘
                                  ┌───────────────┐
                                  │ ✓ SWAPPED  [x]│  toast, bottom-right
                                  │ 1 ETH for 2000│  (bottom, full-width on mobile)
                                  └───────────────┘
```

- Card: `pixel-box bg-panel`, centred, `max-w-[480px]`, 16px side gutter on mobile.
- Panels: `pixel-inset bg-well`. Focus inside a panel → panel border turns `primary`.
- Section labels (`You pay`, `Slippage`, card title): Press Start 2P, uppercase, `text-muted`.
- Flip button: `accent` fill with `on-accent` arrows, overlapping both panels.
- Selected chips (wallet mode, slippage `Auto`): `primary` fill + `on-fill`; gold `accent`
  fill is reserved for the brand/flip and the `Auto` tag in details.
- Activity list in the account menu: `terminal` well, `on-terminal` text, `on-terminal-dim` timestamps,
  `>` prompt, like a trade log.
- Token button: `pixel-btn`, icon 24px + symbol (Press Start 2P 12px) + pixel chevron.
  Empty state (`.is-empty`) is a `primary` button reading "Select token".
- Submit: full width, 56px tall, Press Start 2P 14px. Colour by state class:
  `is-ready`/`is-connect` → `primary`; `is-insufficient` → `danger`; others → `raised` + `muted`
  text, `cursor-not-allowed`.
- Dialogs (picker, review): `pixel-box bg-panel`, max-w 420px, backdrop `shadow/70` with a
  2px dither pattern. On < 480px they become full-width bottom sheets.
- Mobile (< 480px): header wraps to two rows (logo + account / mode switch).

## Copy & icons

Labels in the UI are written in normal case and shown in caps with CSS `uppercase` where a
style wants it (e2e asserts `textContent`, which ignores CSS case).

**Decoration must never add text to elements whose text is asserted** (`#swap-submit`,
`#rate`, `#account-button`, `#sell-balance`, `#detail-min-received`, `.token-balance`,
`.slippage-badge`, `.toast-body`, `#review-sell`/`#review-buy` contain-text is looser).
Glyphs like ▶ ⚙ ✓ are inline SVG with `aria-hidden="true"` (no text nodes) or CSS
`::before` with `content: ""` + background. Labels such as "Min received" sit outside the
element that carries the id.

Icons (T04 `PixelIcon`, 16×16 grid): `gear`, `chevron-down`, `flip`, `close`, `wallet`,
`check`, `cross`, `coin`, `search`, `warn`. Drawn with `<rect>`s, `fill="currentColor"`.
