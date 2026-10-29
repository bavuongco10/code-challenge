import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import type { ZodOpenApiOperationObject, ZodOpenApiPathsObject } from 'zod-openapi';

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';
type Schema = z.ZodType | undefined;
type Out<S extends Schema> = S extends z.ZodType ? z.output<S> : undefined;
type Def<P extends Schema, Q extends Schema, B extends Schema> = {
  summary: string;
  params?: P;
  query?: Q;
  body?: B;
  status?: number; // success status, default 200
  response?: z.ZodType; // omitted = no body
  notFound?: string; // documents a 404 with this message
  badRequest?: string; // docs example of a real 400 message
};

// Docs example: the real 400 for a non-numeric `:id`, same for every feature.
export const BAD_ID = 'id: Invalid input: expected number, received NaN';

const ApiError = z.object({ error: z.string() }).meta({ id: 'Error' });
const json = (schema: z.ZodType, example?: unknown) => ({ 'application/json': { schema, ...(example !== undefined && { example }) } });
const err = (description: string, error: string) => ({ description, content: json(ApiError, { error }) });

// The route definition as a zod-openapi operation; zod-openapi turns it into the OpenAPI spec.
function operation(tag: string, d: Def<Schema, Schema, Schema>): ZodOpenApiOperationObject {
  return {
    summary: d.summary,
    tags: [tag],
    requestParams: {
      ...(d.params && { path: d.params as z.ZodObject }),
      ...(d.query && { query: d.query as z.ZodObject }),
    },
    ...(d.body && { requestBody: { required: true, content: json(d.body) } }),
    responses: {
      [d.status ?? 200]: { description: 'Success', ...(d.response && { content: json(d.response) }) },
      400: err('Invalid input', d.badRequest ?? 'invalid JSON'),
      ...(d.notFound && { 404: err('Not found', d.notFound) }),
      ...(d.body && {
        413: err('Body over 100kb', 'request entity too large'),
        415: err('Body is not JSON', 'content-type must be application/json'),
      }),
      500: err('Unexpected server error', 'internal server error'),
    },
  };
}

// Express router that validates input with zod and records each route as an OpenAPI path,
// so docs can't drift from the code. Handlers return the response body.
export function apiRouter(tag: string) {
  const routes = Router();
  const fallback = Router(); // runs after `routes`: known path, unregistered method -> 405
  const router = Router().use(routes, fallback);
  const paths: ZodOpenApiPathsObject = {};
  function route<P extends Schema, Q extends Schema, B extends Schema>(
    method: Method,
    path: string,
    def: Def<P, Q, B>,
    handler: (input: { params: Out<P>; query: Out<Q>; body: Out<B> }) => Promise<unknown>,
  ) {
    const item = (paths[path.replace(/:(\w+)/g, '{$1}')] ??= {});
    if (!Object.keys(item).length)
      fallback.all(path, (_req, res) => {
        res.set(
          'allow',
          Object.keys(item)
            .flatMap((m) => (m === 'get' ? ['GET', 'HEAD'] : [m.toUpperCase()]))
            .join(', '),
        );
        throw new HttpError(405, 'method not allowed');
      });
    item[method] = operation(tag, def);
    routes[method](path, async (req: Request, res: Response) => {
      const out = await handler({
        params: def.params?.parse(req.params),
        query: def.query?.parse(req.query),
        body: def.body?.parse(req.body ?? {}),
      } as never);
      res.status(def.status ?? 200);
      if (def.response) res.json(out);
      else res.end();
    });
  }
  return { router, paths, route };
}

// Bodies are JSON only; anything else would otherwise parse as {} and fail with a misleading validation error.
export function requireJson(req: Request, _res: Response, next: NextFunction) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json'))
    return next(new HttpError(415, 'content-type must be application/json'));
  next();
}

// Handler helper: 404 with `message` when the repo found no row (undefined, null or false).
export function found<T>(row: T, message: string): Exclude<T, undefined | null | false> {
  if (row === undefined || row === null || row === false) throw new HttpError(404, message);
  return row as Exclude<T, undefined | null | false>;
}

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, 'route not found'));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const e = err as { status?: number; type?: string };
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err instanceof z.ZodError) {
    const i = err.issues[0];
    return res.status(400).json({ error: i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message });
  }
  if (e.type === 'entity.parse.failed') return res.status(400).json({ error: 'invalid JSON' });
  if (e.status && e.status < 500) return res.status(e.status).json({ error: (err as Error).message });
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
}
