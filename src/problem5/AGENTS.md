# AGENTS.md

See `README.md` for setup, endpoints, the docs pipeline and the folder layout. This file is the rules.

## Stack

- Express 5 + TypeScript, run directly by Node 24 type stripping (`.nvmrc`). No build step, no bundler.
- Postgres (Neon) via Drizzle ORM + `pg`. Tests use PGlite (in-process Postgres), no `DATABASE_URL` needed.
- Validation: zod 4, derived from Drizzle tables with `drizzle-zod`. OpenAPI via `zod-openapi`, UI via `@scalar/express-api-reference`.
- Lint: oxlint (`.oxlintrc.json`). Format: oxfmt (`.oxfmtrc.json`). No ESLint/Prettier/Biome.
- Package manager: **pnpm**. Don't use npm/yarn/bun.

## Commands

Run from `src/problem5/`:

- Run: `pnpm start` (reads `.env.local`)
- Tests: `pnpm test`; single file: `node --test src/features/resources/resources.test.ts`
- All static checks (tsc + oxlint + oxfmt --check): `pnpm check`
- New migration after a schema change: `pnpm db:generate`; apply: `pnpm db:migrate`

Before saying a task is done, run `pnpm check` and `pnpm test`. The pre-commit hook (`/.githooks/pre-commit`) runs `pnpm check`.

## Rules

- The Drizzle table in `features/<feature>/<feature>.schema.ts` is the single source of truth. Derive zod schemas
  and types from it; never hand-write a duplicate type or the OpenAPI spec.
- Register every route with `apiRouter(...).route(...)` (`shared/http.ts`) so it is validated and documented.
  Don't mount raw Express handlers for API routes.
- Feature files: `<feature>.schema.ts` (table + zod), `.router.ts` (routes + docs), `.controller.ts` (use cases,
  404s), `.repository.ts` (queries), `.test.ts`. Router → controller → repository; SQL lives only in the repository.
  `shared/` never imports from `features/`.
- Throw `HttpError` for expected errors; responses are `{"error": "message"}`.
- Imports use explicit `.ts` extensions and relative paths (Node type stripping). Use `import type` for types.
  No `enum` / `namespace` / parameter properties (not erasable).
- No `any` / `@ts-ignore` (oxlint errors). Use `unknown` and narrow.
- Tests: `node:test` + `node:assert/strict`, integration-style against PGlite running the real migrations.

## Commits

- Format: `feature(problem5): <imperative summary>`; fixes `fix(problem5): ...`; tooling/docs `chore(problem5): ...`.

## Do not

- Hand-edit `drizzle/` (generated), `pnpm-lock.yaml` or `node_modules/`.
- Commit `.env*` files (except `.env.example`).
- Add a dependency without saying why.
- Touch a database (psql, migrations, `neon`, write requests to the API) without it being logged. Claude Code logs
  automatically via `.claude/hooks/log-db.sh` to `.claude/db-actions.log`; other agents append the same JSON line
  themselves. Never edit or delete that log.
