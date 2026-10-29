# Problem 5: CRUD server

Express + TypeScript on Postgres ([Neon](https://neon.com)) via [Drizzle](https://orm.drizzle.team) + `pg`. Live: https://problem5-three.vercel.app/docs

The Drizzle table in `resources.schema.ts` is the single source of truth: it generates the SQL migrations, the TS types, the zod request validation, and the OpenAPI spec rendered by [Scalar](https://scalar.com) at **`/docs`** (raw spec: `/openapi.json`).

## Requirements

- Node 24 (`.nvmrc`, `engines`; same as Vercel). Native TypeScript type stripping, no build step.
- pnpm

## Install & run

```sh
pnpm install        # also points git core.hooksPath at repo-root .githooks
neon env pull       # writes DATABASE_URL(_UNPOOLED) to .env.local (or fill it from .env.example)
pnpm db:migrate     # apply drizzle/ migrations
pnpm start          # http://localhost:3000/docs
pnpm test           # node:test against in-process Postgres (PGlite); no DB needed
```

## Schema changes

Edit `src/features/*/*.schema.ts`, then `pnpm db:generate` (writes a new file in `drizzle/`, commit it). `pnpm build` (`tsc` + `drizzle-kit migrate`) applies pending migrations; Vercel runs it on every deploy.

## How the API docs are generated

Nothing in the docs is hand-written. At startup the app builds the OpenAPI spec from the same code that handles requests:

```
resources.schema.ts                 resources.router.ts                  zod-openapi                /docs
pgTable('resources', …)  ─drizzle-zod─▶  api.route('get', '/', {      ─paths─▶  createDocument()  ─▶  Scalar UI
  + .meta({ description, example })      summary, query: ListQuery,        → /openapi.json         (@scalar/express-api-reference)
  = zod schemas (Resource, ListQuery…)   response: ResourceList }, handler)
```

1. **Table → zod.** `resources.schema.ts` defines the Drizzle table; `drizzle-zod` derives `Resource`, `CreateResource`, `UpdateResource` from it, so column types, `varchar` lengths and the `status` enum flow into validation. `.meta({ description, example })` adds the docs text; examples are copied from real API responses.
2. **Route → operation.** `apiRouter()` (`shared/http.ts`) wraps Express: each `api.route(method, path, { summary, params, query, body, status, response, notFound, badRequest }, handler)` both mounts the handler (parsing `req.params`/`query`/`body` with those schemas, so invalid input → 400) and records a [zod-openapi](https://github.com/samchungy/zod-openapi) operation (plus the standard 400/404/413/415/500 errors) in `paths`.
3. **Operations → OpenAPI.** `create-app.ts` passes `paths` to zod-openapi's `createDocument()`, which converts the zod schemas and hoists `.meta({ id })` ones (`Resource`, `Error`) into `components.schemas`. Served at `GET /openapi.json`.
4. **Scalar.** `GET /docs` is `@scalar/express-api-reference`, pointed at `/openapi.json` (UI loaded from jsDelivr, version pinned).

So a new route or field shows up in `/docs` on the next deploy with no extra step; a route can't be undocumented because registering it is what documents it. The `openapi documents every route` test guards this.

**Adding an endpoint:** declare its schemas in `*.schema.ts`, register it with `api.route(...)`, and mount `router` + `paths` in `create-app.ts`. That's it.

## Deploy (Vercel)

Set `DATABASE_URL` and `DATABASE_URL_UNPOOLED` in the Vercel project, then `vercel deploy`. `src/server.ts` default-exports the Express app (zero-config detection); the pg pool is registered with `attachDatabasePool` for Fluid compute.

## Quality

```sh
pnpm typecheck      # tsc (noEmit)
pnpm lint           # oxlint
pnpm format         # oxfmt
pnpm check          # tsc + oxlint + oxfmt --check
```

The pre-commit hook (`/.githooks/pre-commit`) runs `pnpm check` for every problem that has staged changes. Skip with `--no-verify`.

## Structure (feature-based)

```
neon.ts                       # Neon project config (neon deploy)
drizzle.config.ts             # drizzle-kit: schema glob, migrations dir, direct DB URL
drizzle/                      # generated SQL migrations (committed)
src/
  server.ts                   # entry: default-exports the app for Vercel, listens locally
  create-app.ts               # mounts feature routers, builds /openapi.json (zod-openapi), /docs (Scalar), error handling
  db.ts                       # pg Pool -> drizzle; any Postgres URL
  shared/http.ts              # apiRouter (zod-validated routes recorded as OpenAPI paths), errors
  features/resources/
    resources.schema.ts       # drizzle table + derived zod schemas/types
    resources.router.ts       # routes: validation schemas + docs metadata
    resources.controller.ts   # use cases: calls the repository, maps missing rows to 404
    resources.repository.ts   # drizzle queries
    resources.test.ts         # integration tests
```

To add a feature, create `features/<name>/` with a `*.schema.ts`, `pnpm db:generate`, and mount its router (and its `paths`) in `create-app.ts`.

## Resource

`{ id, name, description, status: "active" | "archived", createdAt, updatedAt }`

## Endpoints

| Method & path                                                                                               | Success                          | Errors   |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------- | -------- |
| `POST /resources` body `{name, description?, status?}`                                                      | 201 + resource                   | 400      |
| `GET /resources?status=&q=&limit=&offset=` (`q` = case-insensitive name substring; limit 1-100, default 20) | 200 `{items,total,limit,offset}` | 400      |
| `GET /resources/:id`                                                                                        | 200                              | 400, 404 |
| `PATCH /resources/:id` body: any of `name, description, status`                                             | 200                              | 400, 404 |
| `DELETE /resources/:id`                                                                                     | 204                              | 400, 404 |

Errors are JSON: `{"error": "message"}`. Every route can also return 500; bodies must be `application/json` (else 415) and under 100kb (else 413); a known path with the wrong method returns 405 with an `Allow` header. `GET /resources` reads `items` and `total` in one snapshot, ordered by `id`.

## Known limitations

- **No auth, no rate limiting.** Anyone with the URL can create, edit or delete resources. Acceptable for a demo; before real use, put writes behind an API key or user auth and add a Vercel Firewall rate-limit rule (an in-process limiter doesn't work on serverless: each instance counts separately).

```sh
curl -X POST localhost:3000/resources -H 'content-type: application/json' -d '{"name":"Widget","description":"demo"}'
curl 'localhost:3000/resources?status=active&q=wid&limit=10&offset=0'
curl localhost:3000/resources/1
curl -X PATCH localhost:3000/resources/1 -H 'content-type: application/json' -d '{"status":"archived"}'
curl -X DELETE localhost:3000/resources/1
```
