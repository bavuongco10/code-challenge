import { and, count, eq, sql } from 'drizzle-orm';
import type { Db } from '../../db.ts';
import { resources, type ListParams, type NewResource, type ResourcePatch } from './resources.schema.ts';

export function resourcesRepo(db: Db) {
  const byId = (id: number) => eq(resources.id, id);
  return {
    get: async (id: number) => (await db.select().from(resources).where(byId(id)))[0],
    create: async (d: NewResource) => (await db.insert(resources).values(d).returning())[0],
    async list({ status, q, limit, offset }: ListParams) {
      const where = and(
        status ? eq(resources.status, status) : undefined,
        q ? sql`strpos(lower(${resources.name}), lower(${q})) > 0` : undefined, // substring, no LIKE wildcard issues
      );
      // one snapshot so `total` agrees with `items` under concurrent writes
      return db.transaction(
        async (tx) => {
          const items = await tx.select().from(resources).where(where).orderBy(resources.id).limit(limit).offset(offset);
          const [{ total }] = await tx.select({ total: count() }).from(resources).where(where);
          return { items, total, limit, offset };
        },
        { isolationLevel: 'repeatable read', accessMode: 'read only' },
      );
    },
    // undefined when the row doesn't exist
    update: async (id: number, d: ResourcePatch) => (await db.update(resources).set(d).where(byId(id)).returning())[0],
    remove: async (id: number) => (await db.delete(resources).where(byId(id)).returning({ id: resources.id })).length > 0,
  };
}
