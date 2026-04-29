# 03 — Database: Prisma Client & Migration Tooling

The "API" of this layer is the Prisma client and the migration CLI. No HTTP endpoints.

## Prisma client setup

```ts
// packages/db/src/index.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

Connection URL pattern (Azure Postgres + PgBouncer):

```
postgresql://USER:PASS@HOST:6432/agconn?pgbouncer=true&connection_limit=10
```

`pgbouncer=true` tells Prisma to skip prepared statements, which PgBouncer transaction mode doesn't support.

## Per-request transaction (RLS-bound)

The Hono `tenantMiddleware` opens a transaction per request and stores the transaction client on the context, so all DB calls in the request share the same `app.tenant_id` session var:

```ts
await db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`);
    c.set('db', tx);
    await next();
});
```

In handlers, always use `c.get('db')`, never the global `db`:

```ts
api.get('/v1/jobs', async (c) => {
    const tx = c.get('db');
    const jobs = await tx.jobPosting.findMany({ where: notDeleted });
    return c.json(jobs);
});
```

## Migration workflow

### Local development

```bash
# Edit packages/db/schema.prisma
pnpm --filter db prisma migrate dev --name add_xyz
# Prisma applies the migration to the local DB and regenerates the client
```

### CI (PR)

- `prisma migrate diff` runs against the dev database to detect drift.
- `prisma format` and `prisma validate` block on errors.
- Custom CI script (`packages/db/scripts/check-tenant-id.ts`) verifies every model has `tenantId`.
- Custom CI script (`packages/db/scripts/check-rls.ts`) verifies every table has RLS enabled and the standard policies present.

### Production deploy

1. CI builds a Docker image containing `node_modules/.prisma/client` plus the migration files.
2. `apps/api` pod runs an init container that executes `prisma migrate deploy` against the production DB.
3. The pod starts only after migrations succeed.
4. The init container writes a row to `migration_log` with the CI run id.

`prisma migrate deploy` is idempotent and applies only pending migrations.

### Rollback

Prisma does NOT support automatic rollback. Procedure:

1. Inspect the failed migration's SQL (`packages/db/migrations/<name>/migration.sql`).
2. Hand-write the inverse SQL.
3. Apply it via `psql` and mark the migration as rolled back in `_prisma_migrations`.
4. Update code to remove references to the rolled-back schema.

For high-risk migrations, write the rollback SQL upfront and store in `packages/db/migrations/<name>/rollback.sql`.

## Raw SQL policy

Allowed: any query in `packages/db/raw/*.sql` reviewed and tested. Loaded via:

```ts
import { rawQuery } from '@agconn/db/raw';
const stats = await rawQuery('placement-report', { tenantId, startDate, endDate });
```

Banned: ad-hoc `$queryRawUnsafe` outside `packages/db/raw/`. Enforced via ESLint custom rule `agconn/no-raw-sql-outside-raw-dir`.

## Seeding

```bash
pnpm --filter db prisma db seed
```

Seed script at `packages/db/seed/index.ts` orchestrates per-feature seed modules:

```ts
// packages/db/seed/index.ts
await seedTenants();
await seedAdmins();
await seedDevWorkers();
await seedDevEmployers();
await seedDevTrainingPrograms();
await seedDevJobPostings();
```

Seed is dev-only — production never runs `db seed`. Production's first tenant is created via the admin tenant CRUD ([01-multi-tenancy/03-api.md](../01-multi-tenancy/03-api.md)).

## Backups

Azure Postgres Flexible Server PITR (point-in-time recovery): 7-day retention, geo-redundant. No app-level backup logic.

## Prisma version pinning

`prisma` and `@prisma/client` MUST be the exact same version, pinned (no caret). Mismatch causes runtime drift between generated types and engine.
