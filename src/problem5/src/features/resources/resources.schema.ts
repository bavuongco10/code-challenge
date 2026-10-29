import { integer, pgEnum, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from 'zod';

// Single source of truth: the table drives DB migrations (drizzle-kit), TS types, validation and OpenAPI docs.
export const resourceStatus = pgEnum('resource_status', ['active', 'archived']);

export const resources = pgTable('resources', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 200 }).notNull(),
  description: varchar({ length: 2000 }).notNull().default(''),
  status: resourceStatus().notNull().default('active'),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

const fields = { name: true, description: true, status: true } as const;
const name = (s: z.ZodString) => s.trim().min(1);
// Docs examples, copied from real API responses. Set per field too: Scalar builds nested/array examples
// field by field and otherwise falls back to bounds like `id: -2147483648`.
const example = {
  id: 3,
  name: 'Blue widget',
  description: 'Spare part for the assembly line',
  status: 'active',
  createdAt: '2026-10-29T13:13:27.805Z',
  updatedAt: '2026-10-29T13:13:27.805Z',
} as const;
const { name: exName, description } = example;
const ex =
  (v: unknown) =>
  <S extends z.ZodType>(s: S) =>
    s.meta({ example: v });

export const Resource = createSelectSchema(resources, {
  id: (s) => ex(example.id)(s.min(1)), // identity starts at 1; int4 lower bound is meaningless here
  name: ex(example.name),
  description: ex(example.description),
  status: ex(example.status),
  createdAt: z.iso.datetime().meta({ example: example.createdAt }),
  updatedAt: z.iso.datetime().meta({ example: example.updatedAt }),
}).meta({ id: 'Resource', example });
export const CreateResource = createInsertSchema(resources, { name })
  .pick(fields)
  .meta({ example: { name: exName, description } });
export const UpdateResource = createUpdateSchema(resources, { name })
  .pick(fields)
  .refine((o) => Object.keys(o).length > 0, 'provide at least one of: name, description, status')
  .meta({ example: { status: 'archived' } });
export const NOT_FOUND = 'resource not found';
export const ResourceId = z.object({
  id: z.coerce
    .number()
    .int()
    .min(1)
    .max(2 ** 31 - 1)
    .meta({ example: example.id }),
});
export const ListQuery = z.object({
  status: createSelectSchema(resourceStatus).optional().meta({ description: 'Exact status match', example: 'active' }),
  q: z.string().optional().meta({ description: 'Case-insensitive name substring (`%` and `_` are literal)', example: 'wid' }),
  limit: z.coerce.number().int().min(1).max(100).default(20).meta({ description: 'Page size', example: 10 }),
  offset: z.coerce.number().int().min(0).default(0).meta({ description: 'Rows to skip', example: 0 }),
});
export const ResourceList = z
  .object({
    items: z.array(Resource),
    total: z.number().int().min(0).meta({ description: 'Rows matching the filters, ignoring paging', example: 1 }),
    limit: z.number().int().min(1).meta({ example: 20 }),
    offset: z.number().int().min(0).meta({ example: 0 }),
  })
  .meta({ example: { items: [example], total: 1, limit: 20, offset: 0 } });

export type NewResource = z.infer<typeof CreateResource>;
export type ResourcePatch = z.infer<typeof UpdateResource>;
export type ListParams = z.infer<typeof ListQuery>;
