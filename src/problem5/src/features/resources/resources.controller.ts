import type { Db } from '../../db.ts';
import { found } from '../../shared/http.ts';
import { resourcesRepo } from './resources.repository.ts';
import { NOT_FOUND, type ListParams, type NewResource, type ResourcePatch } from './resources.schema.ts';

// Use cases: input is already validated by the router; maps "no row" to 404. No HTTP or SQL here.
export function resourcesController(db: Db) {
  const repo = resourcesRepo(db);
  return {
    create: (body: NewResource) => repo.create(body),
    list: (query: ListParams) => repo.list(query),
    get: async (id: number) => found(await repo.get(id), NOT_FOUND),
    update: async (id: number, patch: ResourcePatch) => found(await repo.update(id, patch), NOT_FOUND),
    remove: async (id: number) => void found(await repo.remove(id), NOT_FOUND),
  };
}
