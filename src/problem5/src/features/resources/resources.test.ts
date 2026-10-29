import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { sql } from 'drizzle-orm';
import { createApp } from '../../create-app.ts';
import { openLocalDb, type Db } from '../../db.ts';

let server: Server;
let base: string;
let db: Db;

const listen = async (app: ReturnType<typeof createApp>) => {
  const s = app.listen(0);
  await new Promise((r) => s.once('listening', r));
  return { s, url: `http://localhost:${(s.address() as { port: number }).port}` };
};

before(async () => {
  // in-process Postgres running the real drizzle migrations; no DATABASE_URL needed
  db = await openLocalDb();
  ({ s: server, url: base } = await listen(createApp(db)));
});
// every test starts from an empty table with ids from 1, so results don't depend on test order
beforeEach(() => db.execute(sql`truncate resources restart identity`));
after(() => server.close());

const call = (path: string, method = 'GET', body?: unknown) =>
  fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

test('CRUD flow', async () => {
  let r = await call('/resources', 'POST', { name: 'Alpha', description: 'first' });
  assert.equal(r.status, 201);
  const a = await r.json();
  assert.equal(a.status, 'active');
  assert.equal(a.description, 'first');

  r = await call(`/resources/${a.id}`);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), a);

  r = await call(`/resources/${a.id}`, 'PATCH', { status: 'archived' });
  assert.equal(r.status, 200);
  const patched = await r.json();
  assert.equal(patched.status, 'archived');
  assert.equal(patched.name, 'Alpha');

  r = await call(`/resources/${a.id}`, 'DELETE');
  assert.equal(r.status, 204);
  assert.equal((await call(`/resources/${a.id}`)).status, 404);
  assert.equal((await call(`/resources/${a.id}`, 'DELETE')).status, 404);
});

test('list filters and paging', async () => {
  await call('/resources', 'POST', { name: 'Widget One' });
  await call('/resources', 'POST', { name: 'Widget Two', status: 'archived' });
  await call('/resources', 'POST', { name: '100%_odd' });

  let body = await (await call('/resources?q=widget')).json();
  assert.equal(body.total, 2);
  body = await (await call('/resources?status=archived')).json();
  assert.deepEqual(
    body.items.map((i: { name: string }) => i.name),
    ['Widget Two'],
  );
  body = await (await call('/resources?q=widget&status=active')).json();
  assert.equal(body.total, 1);
  body = await (await call('/resources?q=%25')).json(); // literal %, not a wildcard
  assert.equal(body.total, 1);
  body = await (await call('/resources?limit=1&offset=1')).json();
  assert.equal(body.items.length, 1);
  assert.equal(body.total, 3);
});

test('paging walks every row once, ordered by id', async () => {
  for (let i = 0; i < 7; i++) await call('/resources', 'POST', { name: `r${i}` });
  const ids: number[] = [];
  for (let offset = 0; offset < 10; offset += 3) {
    const page = await (await call(`/resources?limit=3&offset=${offset}`)).json();
    assert.equal(page.total, 7);
    ids.push(...page.items.map((i: { id: number }) => i.id));
  }
  assert.deepEqual(ids, [1, 2, 3, 4, 5, 6, 7]); // past the end = empty page, no overlap
});

test('PATCH bumps updatedAt, keeps createdAt, ignores read-only fields', async () => {
  const a = await (await call('/resources', 'POST', { name: 'A', id: 99, createdAt: '2000-01-01T00:00:00.000Z' })).json();
  assert.equal(a.id, 1);
  assert.notEqual(a.createdAt, '2000-01-01T00:00:00.000Z');
  await new Promise((r) => setTimeout(r, 5));
  const b = await (await call(`/resources/${a.id}`, 'PATCH', { description: 'd', id: 5 })).json();
  assert.equal(b.id, a.id);
  assert.equal(b.createdAt, a.createdAt);
  assert.ok(b.updatedAt > a.updatedAt);
});

test('boundaries', async () => {
  const ok = [
    ['/resources', 'POST', { name: 'x'.repeat(200), description: 'd'.repeat(2000) }],
    ['/resources?limit=100', 'GET'],
  ] as const;
  for (const [path, method, body] of ok) assert.ok((await call(path, method, body)).ok, `${method} ${path}`);
  for (const [path, method, body] of [
    ['/resources', 'POST', { name: 'x'.repeat(201) }],
    ['/resources', 'POST', { name: 'x', description: 'd'.repeat(2001) }],
    ['/resources?limit=101', 'GET'],
    ['/resources?offset=-1', 'GET'],
    ['/resources/0', 'GET'],
    ['/resources/2147483648', 'GET'],
    ['/resources/1.5', 'GET'],
  ] as const) {
    const r = await call(path, method, body);
    assert.equal(r.status, 400, `${method} ${path}`);
  }
  assert.equal((await call('/resources/2147483647')).status, 404);
});

test('validation returns 400', async () => {
  for (const [path, method, body] of [
    ['/resources', 'POST', {}],
    ['/resources', 'POST', { name: '  ' }],
    ['/resources', 'POST', { name: 'x', status: 'nope' }],
    ['/resources', 'POST', []],
    ['/resources/1', 'PATCH', {}],
    ['/resources/abc', 'GET', undefined],
    ['/resources?limit=0', 'GET', undefined],
    ['/resources?status=bad', 'GET', undefined],
  ] as const) {
    const r = await call(path, method, body);
    assert.equal(r.status, 400, `${method} ${path}`);
    assert.ok((await r.json()).error);
  }
  const r = await fetch(base + '/resources', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad' });
  assert.equal(r.status, 400);
});

test('404s', async () => {
  assert.equal((await call('/resources/99999')).status, 404);
  assert.equal((await call('/resources/99999', 'PATCH', { name: 'x' })).status, 404);
  assert.equal((await call('/nope')).status, 404);
});

test('protocol errors are JSON with the right status', async () => {
  let r = await call('/resources/1', 'PUT', { name: 'x' });
  assert.equal(r.status, 405);
  assert.equal(r.headers.get('allow'), 'GET, HEAD, PATCH, DELETE');
  r = await call('/resources', 'DELETE');
  assert.equal(r.status, 405);
  assert.equal(r.headers.get('allow'), 'POST, GET, HEAD');

  r = await fetch(base + '/resources', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{"name":"x"}' });
  assert.equal(r.status, 415);
  assert.deepEqual(await r.json(), { error: 'content-type must be application/json' });
  r = await fetch(base + '/resources', { method: 'POST' }); // no body, no content-type
  assert.equal(r.status, 415);

  r = await call('/resources', 'POST', { name: 'x', description: 'd'.repeat(200_000) });
  assert.equal(r.status, 413);
  assert.deepEqual(await r.json(), { error: 'request entity too large' });

  assert.equal((await call('/resources')).headers.get('x-powered-by'), null);
});

test('database failure is a generic 500, no internals leaked', async (t) => {
  const dead = new PGlite();
  await dead.close(); // every query now throws
  const { s, url } = await listen(createApp(drizzle(dead)));
  t.after(() => s.close());
  t.mock.method(console, 'error', () => {}); // keep test output clean
  const r = await fetch(url + '/resources');
  assert.equal(r.status, 500);
  assert.deepEqual(await r.json(), { error: 'internal server error' });
});

test('openapi documents every route', async () => {
  const spec = await (await call('/openapi.json')).json();
  const ops = Object.entries(spec.paths).flatMap(([p, m]) => Object.keys(m as object).map((k) => `${k} ${p}`));
  assert.deepEqual(ops.sort(), [
    'delete /resources/{id}',
    'get /resources',
    'get /resources/{id}',
    'patch /resources/{id}',
    'post /resources',
  ]);
  assert.deepEqual(spec.components.schemas.Resource.properties.status.enum, ['active', 'archived']);
  const q = spec.paths['/resources'].get.parameters.find((p: { name: string }) => p.name === 'q');
  assert.equal(q.schema.example, 'wid');
  // docs examples come from real responses, never schema bounds like id: -2147483648
  const json = JSON.stringify(spec);
  assert.ok(!/"(example|minimum)":-\d/.test(json));
  assert.equal(spec.components.schemas.Resource.properties.id.example, 3);
  assert.equal(spec.paths['/resources/{id}'].get.responses[404].content['application/json'].example.error, 'resource not found');
  assert.equal((await call('/docs')).status, 200);
});
