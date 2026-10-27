# AGENTS.md

## Stack

- React 19 + TypeScript 6, built with Vite 8 (`@vitejs/plugin-react`).
- State: Jotai 3 (`jotai`). Don't add Redux/Zustand/Context-based stores.
- Server data: TanStack Query 5 (`@tanstack/react-query`) bridged into Jotai by `jotai-tanstack-query`.
- Styling: Tailwind CSS 4 via `@tailwindcss/vite` (no `tailwind.config.js`; config lives in CSS).
- UI primitives: Headless UI 2 (`@headlessui/react`). Don't add other component libraries (MUI, Radix, shadcn...). Exception: Reown AppKit for wallet connection modal in phase 2.
- Lint: oxlint (`.oxlintrc.json`). Format: Prettier (`.prettierrc`, defaults). No ESLint or Biome.
- Package manager: **pnpm** (`pnpm-lock.yaml`). Don't use npm/yarn/bun.
- Node: 26.12.1 (`.nvmrc`).

## Repo layout

```
.problem/               original skeleton (index.html, script.js, style.css, problem.md). Reference only, not built
public/                 static assets served as-is
index.html              Vite entry HTML
src/
  main.tsx              entry: mounts <App />
  app/                  App.tsx shell, global styles, providers. Wires features together; no feature logic
  features/<feature>/   one folder per feature, e.g. features/swap/
    components/         UI used only by this feature
    atoms.ts            feature atoms (Jotai)
    hooks/              feature hooks wrapping atoms or effects
    api/                fetch calls and response parsing
    types.ts            feature types
    index.ts            public API: the only file other code may import from
  shared/               code used by 2+ features
    ui/                 generic components (Button, Spinner, TokenIcon...)
    hooks/  lib/        generic hooks and pure utils (formatting, number parsing)
```

Rules:

- A feature imports another feature only through its `index.ts`, never its internals.
- `shared/` never imports from `features/` or `app/`.
- Start code inside the feature. Move it to `shared/` only once a second feature needs it.
- Create only the subfolders a feature actually uses. A feature with a single component doesn't need `components/`.

## Commands

Run these from `src/problem2/`:

- Dev server: `pnpm dev`
- Build (typecheck + bundle): `pnpm build`
- Typecheck only: `pnpm exec tsc -b`
- Lint: `pnpm lint`
- Format: `pnpm format` (check only: `pnpm format:check`)
- Preview the build: `pnpm preview`
- Tests (watch): `pnpm test`
- Tests (once, CI-style): `pnpm exec vitest run`
- Single test file: `pnpm exec vitest run src/features/swap/lib/convert.test.ts`
- All static checks (typecheck + lint + format check, no tests): `pnpm check`

Before saying a task is done, run `pnpm check`. `pnpm check` is the single source of truth for static checks; the pre-commit hook (`.githooks/pre-commit`, enabled by `pnpm install` via `prepare`) and any future CI call it rather than repeat the commands.

## File naming

- Folders: `kebab-case` (`features/token-select/`).
- Components: `PascalCase.tsx`, one component per file, filename = component name (`SwapForm.tsx`).
- Hooks: `useCamelCase.ts` (`useTokenPrices.ts`).
- Everything else (utils, api, constants): `camelCase.ts` (`formatAmount.ts`, `fetchPrices.ts`).
- Types: `types.ts` per feature. Use a separate file only if it gets large.
- Tests: next to the file under test, `<name>.test.ts(x)` (`formatAmount.test.ts`).
- Barrels: only a feature's `index.ts`. No `index.ts` inside subfolders.

## Testing

- Vitest 5 using the Vite config (no separate `vitest.config`). Default `node` environment.
- Import test APIs explicitly: `import { describe, expect, it } from 'vitest'`. Globals are off.
- Test pure logic first (conversion math, amount parsing/validation, price-list cleanup).
- Mock `fetch` with `vi.stubGlobal('fetch', ...)`. Tests never hit the real prices URL.
- Query atoms share one default `QueryClient`; give each test store its own:
  `store.set(queryClientAtom, new QueryClient())`, or cached data leaks between tests.
- Test atoms without React: `const store = createStore(); store.set(amountAtom, '1'); expect(store.get(convertedAtom))...`
- TODO: component tests need `jsdom` + `@testing-library/react`. Not installed; add them with the first component test.

## State (Jotai)

- Feature state lives in `features/<feature>/atoms.ts`, with names ending in `Atom` (`fromTokenAtom`, `amountAtom`).
- Store minimal state in primitive atoms. Compute everything else in derived atoms
  (`atom((get) => ...)`), e.g. the converted amount or a validation error. Never copy derived values into state.
- Server data such as prices goes through TanStack Query (`@tanstack/react-query`), exposed as atoms with
  `atomWithQuery` from `jotai-tanstack-query`. Map the query result to a feature state in a derived atom. Refetch via
  `get(queryClientAtom).refetchQueries(...)`; the query atom's own setter only re-reads the cache.
- In components, use `useAtomValue` to read and `useSetAtom` to write. Use `useAtom` only when you need both.
- Atoms are private to their feature. Expose them through `index.ts` only if another feature really needs them.
- Plain `useState` is fine for UI-only local state (open/closed, hover).
- One `<Provider>` in `src/app/` is optional; the default store works. Tests use `createStore()` per test.

## Styling & UI

- Style with Tailwind utility classes in JSX. No per-component `.css` files and no CSS modules.
- The only CSS file is the global stylesheet, which starts with `@import "tailwindcss";`. Put theme tokens there
  in `@theme { ... }` (colors, fonts), not in a JS config.
- Use Headless UI for interactive widgets: `Listbox` / `Combobox` for the token picker, `Dialog` for modals,
  `Field` + `Label` + `Input` + `Description` for form fields. Style them with Tailwind, including the
  `data-[focus]`, `data-[selected]`, `data-[disabled]` and `data-[open]` variants.
- Don't hand-roll dropdowns, modals or focus traps. Headless UI handles keyboard nav and ARIA.
- Conditional classes: template strings or a small local helper. Don't add `clsx` / `tailwind-merge` unless needed.
- Dark-only theme (NES navy palette, see `docs/features/swap/impl/design.md`). No light mode, no `dark:` variants.

## Conventions

- TS settings that matter: `verbatimModuleSyntax` (use `import type` for types),
  `erasableSyntaxOnly` (no `enum` / `namespace` / parameter properties),
  `noUnusedLocals` / `noUnusedParameters`, `strict`.
- No `any` / `@ts-ignore` (oxlint errors). Use `unknown` and narrow it, e.g. validate the prices JSON.
- No path aliases. Use relative imports.
- Components are function components with hooks. Files that export components should export
  only components, because oxlint enforces `only-export-components`.
- Env vars: only `VITE_`-prefixed vars reach the client, and they ship in the bundle. Never put secrets in them.
- Data fetching: plain `fetch` in `features/<feature>/api/`, run as the `queryFn` of an `atomWithQuery`. Don't call
  `useQuery` in components; read the atom. Don't add SWR or another fetching library.
- Accessibility: every input has a label, errors are announced (`aria-live` / `aria-describedby`),
  and the form works with the keyboard alone.

## Commits

- Format: `feature(problem2): <imperative summary>`, e.g. `feature(problem2): Add token picker`.
- Fixes: `fix(problem2): ...`; tooling/docs: `chore(problem2): ...`.

## Do not

- Edit `dist/`, `node_modules/` or `pnpm-lock.yaml` by hand.
- Build on top of `.problem/`. It is the original reference.
- Commit `.env*` files (except `.env.example`).
- Add a dependency without saying why.

## Feature docs

- Feature behavior is documented in `docs/features/<feature>/plan.md` (start: `docs/features/swap/plan.md`).
  Read the relevant one before changing a feature.
- If your change alters a business rule, validation or edge case, update that doc in the same
  change. If unsure, say so in your summary.
- Don't touch feature docs for refactors that don't change behavior.
- Big, hard-to-reverse technical decisions get an ADR in `docs/adr/` (see its README).
