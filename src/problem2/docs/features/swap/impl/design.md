# Design: 8-bit swap

The swap is an NES-style arcade terminal, dark only: dark navy page with a faint dot grid,
navy "windows" in NES pixel frames (white, notched corners) with hard black drop shadows,
yellow for the active/selected thing, cyan as the action colour, and green for success and
terminal text. Press Start 2P + VT323 bitmap fonts, stepped animations. Behaviour is unchanged
by the look: rules live in `../plan.md`.

## Palette

Defined once in `src/index.css` as Tailwind theme tokens. Components use token classes only
(`bg-panel`, `text-ink`, `placeholder:text-dim` …), never raw hex. There is no light mode:
`color-scheme: dark`, one set of values.

| Token             | Value     | Used for                                              |
| ----------------- | --------- | ----------------------------------------------------- |
| `paper`           | `#0b1030` | page background                                       |
| `panel`           | `#161d48` | card, dialogs, popovers                               |
| `well`            | `#0a0e26` | amount panels, inputs (inset)                         |
| `raised`          | `#262f66` | disabled submit, inactive tabs, account chip          |
| `ink`             | `#f4f4f8` | text, input values, pixel frames                      |
| `muted`           | `#a3b2dc` | labels, USD values, balances, disabled labels         |
| `dim`             | `#7686b4` | placeholders, timestamps, footnotes                   |
| `line`            | `#f4f4f8` | secondary borders                                     |
| `shadow`          | `#000000` | hard drop shadow                                      |
| `primary`         | `#3ce0f0` | cyan: primary button, focus ring, active segment      |
| `accent`          | `#ffd23f` | yellow: logo, flip button, `Auto` tag (fill only)     |
| `success`         | `#5ce36c` | green: success toast, `Free` fee                      |
| `warn`            | `#ffd23f` | `is-high` slippage, high deadline, pending toast icon |
| `danger`          | `#ff6b6b` | `is-error`, `is-very-high`, insufficient, error toast |
| `on-fill`         | `#0b1030` | text on `primary` / `danger` / `success` fills        |
| `on-accent`       | `#0b1030` | text on `accent` fills                                |
| `terminal`        | `#050820` | activity log background                               |
| `on-terminal`     | `#5ce36c` | activity log text                                     |
| `on-terminal-dim` | `#7686b4` | activity log timestamps                               |

Rules:

- `accent` is a **fill only**; for yellow text use `text-warn` (same hex, semantic name).

## Contrast (WCAG 2.2 AA)

Text needs 4.5:1, non-text UI (borders that identify a control, focus rings) 3:1. Computed
from the token values (WCAG relative luminance):

| Pair                                                | Ratio        |
| --------------------------------------------------- | ------------ |
| Amount input value (`ink` / `well`)                 | 17.34        |
| Amount placeholder (`dim` / `well`)                 | 5.29         |
| Insufficient amount (`danger` / `well`)             | 6.86         |
| USD value, balance (`muted` / `well`)               | 9.02         |
| Settings inputs value / placeholder                 | 17.34 / 5.29 |
| Labels on card (`muted` / `panel`)                  | 7.64         |
| Disabled submit label (`muted` / `raised`)          | 5.92         |
| `on-fill` / `primary`                               | 11.59        |
| `on-fill` / `danger`                                | 6.69         |
| `on-accent` / `accent`                              | 12.86        |
| `warn` / `panel`                                    | 11.16        |
| `success` / `panel`                                 | 9.71         |
| `danger` / `panel`                                  | 5.81         |
| Focus ring (`primary`) / `panel`, `well`            | 10.06, 11.88 |
| Frame (`ink` / `panel`, `paper`), non-text          | 14.69, 16.92 |
| Activity timestamp (`on-terminal-dim` / `terminal`) | 5.50         |
| Activity log (`on-terminal` / `terminal`)           | 11.92        |

Any new colour pair must be added here with its ratio. Placeholders count as text (4.5:1),
since they carry the format hint (`0`, `0.5`).

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

| Utility       | What it does                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| `pixel-box`   | 4px NES frame (`border-image`, notched corners) + `box-shadow: 4px 4px 0 shadow` |
| `pixel-inset` | NES frame + inner hard shadow (`inset 4px 4px 0`), for wells/inputs              |
| `pixel-btn`   | NES frame + bottom-right bevel + drop shadow; `:active` moves 4px and insets     |
| `pixel-focus` | `:focus-visible` → 4px `primary` outline, offset 2px, square                     |
| `pixel-steps` | `transition-timing-function: steps(4)` for all transitions                       |

- Frames come from a 12×12 SVG `border-image` sliced at 4px (`--frame-ink`); the empty corner
  cells give the notch. Override per element with `--frame` (not inherited), e.g.
  `focus-within:[--frame:var(--frame-primary)]`. Add a new `--frame-*` for a new frame colour.
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
- Panels: `pixel-inset bg-well`. Focus inside a panel → panel frame turns `primary` (`--frame-primary`).
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
