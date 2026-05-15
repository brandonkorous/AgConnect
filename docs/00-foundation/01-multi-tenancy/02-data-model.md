# 01 — Multi-tenancy: Data Model

## tenants table

```prisma
model Tenant {
  id          String     @id @default(uuid()) @db.Uuid
  slug        String     @unique
  name        String
  plan        TenantPlan @default(starter)
  settings    Json       @default("{}")
  clerkOrgId  String?    @unique @map("clerk_org_id")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt        @map("updated_at")
  deletedAt   DateTime?                    @map("deleted_at")

  @@map("tenants")
}

enum TenantPlan {
  starter
  pro
  enterprise
}
```

## tenants.settings JSONB shape

```ts
// packages/shared-types/src/tenant.ts
export const TenantSettingsSchema = z
    .object({
        branding: z
            .object({
                logoUrl: z.string().url().optional(),
                primaryColor: z.string().optional(), // OKLCH or hex
                secondaryColor: z.string().optional(),
            })
            .optional(),
        featureFlags: z.record(z.string(), z.boolean()).optional(),
        reporting: z
            .object({
                defaultExportFormat: z.enum(['csv', 'xlsx']).default('csv'),
                quartersOffset: z.number().int().default(0),
            })
            .optional(),
    })
    .strict();
```

## tenant_id FK pattern

Every table that holds tenant-scoped data MUST include:

```prisma
tenantId String @db.Uuid @map("tenant_id")
tenant   Tenant @relation(fields: [tenantId], references: [id])

@@index([tenantId])
```

The only tables exempt from `tenant_id` are: `tenants` itself, `migration_log`, and any global-system tables (none planned for MVP).

## RLS policy template

For every tenant-scoped table:

```sql
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_select ON <table_name>
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_insert ON <table_name>
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_update ON <table_name>
  FOR UPDATE
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_delete ON <table_name>
  FOR DELETE
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

The admin role bypasses RLS via:

```sql
CREATE POLICY admin_bypass ON <table_name>
  USING (current_setting('app.role', true) = 'admin')
  WITH CHECK (current_setting('app.role', true) = 'admin');
```

> **Inferred:** Using session-level `current_setting()` rather than per-row JWT claims. This means the Hono middleware must `SET LOCAL app.tenant_id = '<uuid>'` at the start of each request transaction. The alternative (passing JWT claims through PostgREST-style) was rejected because we use Prisma directly, not Supabase. If we ever move to a connection-pool-without-transactions setup (e.g., PgBouncer transaction mode hits us hard), revisit by using Prisma `$extends` interactive transactions.

## Indexes

- Every `tenant_id` column gets a btree index.
- Composite indexes that include `tenant_id` as the leading column are preferred for any query path that filters by tenant + something else (which is every query path).
- Example: `@@index([tenantId, status])` on `applications` instead of two separate indexes.

## Seed data

The seed script creates a single tenant for development:

```ts
// packages/db/seed.ts
await prisma.tenant.create({
    data: {
        id: '00000000-0000-0000-0000-000000000001',
        slug: 'central-valley',
        name: 'AGCONN Central Valley',
        plan: 'pro',
        settings: {
            reporting: { defaultExportFormat: 'csv', quartersOffset: 0 },
        },
    },
});
```

The seed tenant id is hard-coded so dev data can reference it without lookups. Production tenants get random UUIDs.
