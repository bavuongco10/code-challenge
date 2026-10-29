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

const seed = async () => {
  await call('/resources', 'POST', { name: 'Widget One' });
  await call('/resources', 'POST', { name: 'Widget Two', status: 'archived' });
  await call('/resources', 'POST', { name: '100%_odd' });
};
const names = async (path: string) => {
  const body = await (await call(path)).json();
  return { total: body.total, names: body.items.map((i: { name: string }) => i.name) };
};

test('list: no filters returns everything with default paging', async () => {
  await seed();
  const body = await (await call('/resources')).json();
  assert.equal(body.total, 3);
  assert.equal(body.limit, 20);
  assert.equal(body.offset, 0);
});

test('list: q is a case-insensitive substring', async () => {
  await seed();
  assert.deepEqual(await names('/resources?q=WIDGET'), { total: 2, names: ['Widget One', 'Widget Two'] });
});

test('list: q treats % and _ literally', async () => {
  await seed();
  assert.deepEqual(await names('/resources?q=%25'), { total: 1, names: ['100%_odd'] });
  assert.deepEqual(await names('/resources?q=_'), { total: 1, names: ['100%_odd'] });
});

test('list: status filter, alone and combined with q', async () => {
  await seed();
  assert.deepEqual(await names('/resources?status=archived'), { total: 1, names: ['Widget Two'] });
  assert.deepEqual(await names('/resources?q=widget&status=active'), { total: 1, names: ['Widget One'] });
  assert.deepEqual(await names('/resources?q=odd&status=archived'), { total: 0, names: [] });
});

test('list: limit=100 is the cap, offset past the end is an empty page', async () => {
  await seed();
  assert.equal((await call('/resources?limit=100')).status, 200);
  assert.equal((await call('/resources?limit=101')).status, 400);
  assert.deepEqual(await names('/resources?offset=3'), { total: 3, names: [] });
  assert.deepEqual(await names('/resources?limit=1&offset=1'), { total: 3, names: ['Widget Two'] });
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

const expect400 = async (path: string, method: string, body: unknown, error: string) => {
  const r = await call(path, method, body);
  assert.equal(r.status, 400, `${method} ${path}`);
  assert.deepEqual(await r.json(), { error });
};

test('400: name is required, non-blank, <=200 chars', async () => {
  await expect400('/resources', 'POST', {}, 'name: Invalid input: expected string, received undefined');
  await expect400('/resources', 'POST', { name: '  ' }, 'name: Too small: expected string to have >=1 characters');
  await expect400('/resources', 'POST', { name: 'x'.repeat(201) }, 'name: Too big: expected string to have <=200 characters');
  await expect400('/resources', 'POST', { name: 1 }, 'name: Invalid input: expected string, received number');
  assert.equal((await call('/resources', 'POST', { name: 'x'.repeat(200) })).status, 201);
});

test('400: description <=2000 chars', async () => {
  await expect400(
    '/resources',
    'POST',
    { name: 'x', description: 'd'.repeat(2001) },
    'description: Too big: expected string to have <=2000 characters',
  );
  assert.equal((await call('/resources', 'POST', { name: 'x', description: 'd'.repeat(2000) })).status, 201);
});

test('400: status must be active or archived', async () => {
  const r = await call('/resources', 'POST', { name: 'x', status: 'nope' });
  assert.equal(r.status, 400);
  assert.match((await r.json()).error, /^status: /);
});

test('400: body must be an object, PATCH needs at least one field', async () => {
  await expect400('/resources', 'POST', [], 'Invalid input: expected object, received array');
  await call('/resources', 'POST', { name: 'x' });
  await expect400('/resources/1', 'PATCH', {}, 'provide at least one of: name, description, status');
  await expect400('/resources/1', 'PATCH', { name: '' }, 'name: Too small: expected string to have >=1 characters');
});

test('400: id must be an int in 1..2^31-1', async () => {
  for (const id of ['abc', '0', '1.5', '2147483648']) {
    const r = await call(`/resources/${id}`);
    assert.equal(r.status, 400, id);
    assert.match((await r.json()).error, /^id: /);
  }
  assert.equal((await call('/resources/2147483647')).status, 404);
});

test('400: limit and offset', async () => {
  await expect400('/resources?limit=0', 'GET', undefined, 'limit: Too small: expected number to be >=1');
  await expect400('/resources?limit=abc', 'GET', undefined, 'limit: Invalid input: expected number, received NaN');
  await expect400('/resources?offset=-1', 'GET', undefined, 'offset: Too small: expected number to be >=0');
  await expect400('/resources?offset=1.5', 'GET', undefined, 'offset: Invalid input: expected int, received number');
  assert.equal((await call('/resources?status=bad')).status, 400);
});

test('400: malformed JSON body', async () => {
  for (const body of ['{bad', 'null', '"x"']) {
    const r = await fetch(base + '/resources', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
    assert.equal(r.status, 400, body);
    assert.deepEqual(await r.json(), { error: 'invalid JSON' });
  }
});

test('404: missing id on GET, PATCH and DELETE, and unknown routes', async () => {
  for (const method of ['GET', 'PATCH', 'DELETE']) {
    const r = await call('/resources/99999', method, method === 'PATCH' ? { name: 'x' } : undefined);
    assert.equal(r.status, 404, method);
    assert.deepEqual(await r.json(), { error: 'resource not found' });
  }
  const r = await call('/nope');
  assert.equal(r.status, 404);
  assert.deepEqual(await r.json(), { error: 'route not found' });
});

test('405: unregistered method lists the allowed ones', async () => {
  let r = await call('/resources/1', 'PUT', { name: 'x' });
  assert.equal(r.status, 405);
  assert.equal(r.headers.get('allow'), 'GET, HEAD, PATCH, DELETE');
  assert.deepEqual(await r.json(), { error: 'method not allowed' });
  r = await call('/resources', 'DELETE');
  assert.equal(r.status, 405);
  assert.equal(r.headers.get('allow'), 'POST, GET, HEAD');
});

test('415: body must be sent as application/json', async () => {
  let r = await fetch(base + '/resources', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{"name":"x"}' });
  assert.equal(r.status, 415);
  assert.deepEqual(await r.json(), { error: 'content-type must be application/json' });
  r = await fetch(base + '/resources', { method: 'POST' }); // no body, no content-type
  assert.equal(r.status, 415);
});

test('413: body over 100kb', async () => {
  const r = await call('/resources', 'POST', { name: 'x', description: 'd'.repeat(200_000) });
  assert.equal(r.status, 413);
  assert.deepEqual(await r.json(), { error: 'request entity too large' });
  assert.equal((await call('/resources')).headers.get('x-powered-by'), null);
});

test('concurrent PATCHes of different fields both land (atomic UPDATE, no lost update)', async () => {
  await call('/resources', 'POST', { name: 'A' });
  for (let i = 0; i < 10; i++) {
    await Promise.all([
      call('/resources/1', 'PATCH', { name: `n${i}` }),
      call('/resources/1', 'PATCH', { description: `d${i}` }),
      call('/resources/1', 'PATCH', { status: i % 2 ? 'active' : 'archived' }),
    ]);
    const r = await (await call('/resources/1')).json();
    assert.deepEqual([r.name, r.description, r.status], [`n${i}`, `d${i}`, i % 2 ? 'active' : 'archived']);
  }
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
