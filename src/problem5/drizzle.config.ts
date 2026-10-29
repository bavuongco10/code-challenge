import { defineConfig } from 'drizzle-kit';

try {
  process.loadEnvFile('.env.local'); // local; on Vercel/CI the env is injected
} catch {}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/features/*/*.schema.ts',
  out: './drizzle',
  // migrations need a direct (non-pooled) connection
  dbCredentials: { url: (process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL)! },
});
