import express from 'express';
import { createApp } from './create-app.ts';
import { openDb } from './db.ts';

// Vercel entrypoint (default export) and local server.
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required (run `neon env pull` or see .env.example)');
const app = createApp(openDb(url), express());
export default app;

if (!process.env.VERCEL) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`listening on http://localhost:${port} (docs: /docs)`));
}
