import { attachDatabasePool } from '@vercel/functions';
import { drizzle } from 'drizzle-orm/node-postgres';
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
