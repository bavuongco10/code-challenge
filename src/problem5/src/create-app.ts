import { apiReference } from '@scalar/express-api-reference';
import express from 'express';
import { createDocument } from 'zod-openapi';
import type { Db } from './db.ts';
import { resourcesRouter } from './features/resources/resources.router.ts';
import { errorHandler, notFound, requireJson } from './shared/http.ts';

export function createApp(db: Db, app = express()) {
  const resources = resourcesRouter(db);
  const prefix = (base: string, paths: object) =>
    Object.fromEntries(Object.entries(paths).map(([p, v]) => [base + p.replace(/\/$/, ''), v]));
  const spec = createDocument(
    { openapi: '3.1.0', info: { title: 'Resources API', version: '1.0.0' }, paths: prefix('/resources', resources.paths) },
    // z.iso.datetime() emits a ~400-char regex; `format: date-time` already says it all
    { override: ({ jsonSchema }) => void (jsonSchema.format === 'date-time' && delete jsonSchema.pattern) },
  );
  app.disable('x-powered-by');
  app.use(requireJson, express.json());
  app.use('/resources', resources.router);
  app.get('/openapi.json', (_req, res) => res.json(spec));
  app.get(
    '/docs',
    apiReference({ url: '/openapi.json', pageTitle: 'Resources API', cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.74.0' }),
  );
  app.get('/', (_req, res) => res.redirect('/docs'));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
