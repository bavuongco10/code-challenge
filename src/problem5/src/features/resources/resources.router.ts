import { BAD_ID, apiRouter } from '../../shared/http.ts';
import type { Db } from '../../db.ts';
import { resourcesController } from './resources.controller.ts';
import { CreateResource, ListQuery, NOT_FOUND, Resource, ResourceId, ResourceList, UpdateResource } from './resources.schema.ts';

export function resourcesRouter(db: Db) {
  const c = resourcesController(db);
  const api = apiRouter('Resources');

  api.route(
    'post',
    '/',
    {
      summary: 'Create a resource',
      body: CreateResource,
      status: 201,
      response: Resource,
      badRequest: 'name: Too small: expected string to have >=1 characters',
    },
    ({ body }) => c.create(body),
  );
  api.route(
    'get',
    '/',
    { summary: 'List resources', query: ListQuery, response: ResourceList, badRequest: 'limit: Too big: expected number to be <=100' },
    ({ query }) => c.list(query),
  );
  api.route(
    'get',
    '/:id',
    { summary: 'Get a resource', params: ResourceId, response: Resource, notFound: NOT_FOUND, badRequest: BAD_ID },
    ({ params }) => c.get(params.id),
  );
  api.route(
    'patch',
    '/:id',
    { summary: 'Update a resource', params: ResourceId, body: UpdateResource, response: Resource, notFound: NOT_FOUND, badRequest: BAD_ID },
    ({ params, body }) => c.update(params.id, body),
  );
  api.route(
    'delete',
    '/:id',
    { summary: 'Delete a resource', params: ResourceId, status: 204, notFound: NOT_FOUND, badRequest: BAD_ID },
    ({ params }) => c.remove(params.id),
  );

  return api;
}
