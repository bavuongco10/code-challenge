import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { attachDatabasePool } from '@vercel/functions';
import { drizzle } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';

// Any Postgres driver's drizzle instance (node-postgres in prod, PGlite in tests).
export type Db = PgDatabase<PgQueryResultHKT>;

// Any Postgres URL works (Neon, Supabase, RDS, local); switching provider = changing DATABASE_URL.
export function openDb(url: string): Db {
  // bounded wait instead of hanging until the platform timeout; small per-instance pool (Fluid shares it across requests)
  const pool = new Pool({ connectionString: url, max: 5, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10_000 });
  // an idle client dropped by the server (e.g. Neon scale-to-zero) is emitted here; unhandled it crashes the process
  pool.on('error', (err) => console.error('pg idle client error', err));
  attachDatabasePool(pool); // Vercel Fluid: close idle clients before the instance suspends; no-op elsewhere
  return drizzle(pool);
}

// No DATABASE_URL: in-process Postgres (PGlite) running the real migrations, so `pnpm start` and tests need no setup.
// ponytail: in-memory, data is lost on restart; pass a dir (`new PGlite('.pglite')`) if local persistence is wanted.
export async function openLocalDb(): Promise<Db> {
  const db = drizzlePglite(new PGlite());
  await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
  return db;
}
