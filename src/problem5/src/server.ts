import express from 'express';
import { createApp } from './create-app.ts';
import { openDb, openLocalDb } from './db.ts';

// Vercel entrypoint (default export) and local server.
const url = process.env.DATABASE_URL;
if (!url && process.env.VERCEL) throw new Error('DATABASE_URL is required on Vercel (see .env.example)');
if (!url) console.log('DATABASE_URL not set: using in-memory Postgres (PGlite), data resets on restart');
const app = createApp(url ? openDb(url) : await openLocalDb(), express());
export default app;

if (!process.env.VERCEL) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`listening on http://localhost:${port} (docs: /docs)`));
}
