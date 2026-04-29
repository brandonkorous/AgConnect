# 01 — Multi-tenancy: Edge Cases & Risks

## Clerk org missing for a user

Workers authenticate with phone OTP and may not be in a Clerk Organization (Clerk Orgs are used for employers and tenants). Resolution path in `tenantMiddleware`:

1. If `auth.orgId` is set → look up tenant by `clerkOrgId`.
2. Else → look up the user's `tenant_id` in our `users` table by `id` (which equals Clerk `userId`).
3. Else → `403 no_tenant`.

> **Inferred:** Worker accounts get their `tenant_id` from one of: (a) the Clerk Organization invite metadata they used to sign up, (b) the URL slug they signed up under (e.g. `central-valley.agconn.com`), or (c) the default tenant for MVP. Defaulting to "the only tenant" works for MVP but **must be revisited before launching tenant #2** — at that point worker signup must collect/derive the tenant from the URL or invite.

## User changes tenant

Not supported in MVP. A user belongs to exactly one tenant for life. If a user needs to move (e.g., they relocate from Central Valley to Salinas), they re-register on the new tenant. This is a deliberate simplification — supporting tenant migration introduces consent flows, data portability decisions, and conflicting Clerk Organization memberships.

Future plan: an admin tool that copies the user's `worker_profile` (with their consent) to the new tenant, leaves the old profile soft-deleted, and updates Clerk metadata. Out of scope for MVP.

## RLS bypass via raw SQL

Engineers may be tempted to use `$queryRawUnsafe` for performance.

**Policy:**

- All raw SQL must include `WHERE tenant_id = $1` explicitly, even if RLS would also filter.
- Raw SQL queries must live in `packages/db/raw/` and be reviewed.
- Admin-only raw SQL (cross-tenant aggregates) must `SET LOCAL app.role = 'admin'` first.
- ESLint custom rule blocks `$queryRaw`/`$executeRaw` outside `packages/db/raw/`.

## Forgotten `tenant_id` on new table

**Mitigation:** `packages/db/scripts/check-tenant-id.ts` runs in CI:

- Parses the Prisma schema.
- For every model not in the allowlist (`Tenant`, `MigrationLog`), asserts presence of `tenantId String @db.Uuid` and `@@index([tenantId])`.
- Fails the CI build with an actionable message if missing.

## Per-tenant feature flags

`tenants.settings.featureFlags` is read at request time and exposed via `c.get('flags')` (see [03-api.md](03-api.md)). Workers and employers see no flag UI; admins toggle per-tenant flags through `PATCH /admin/v1/tenants/:id`.

Anti-pattern: do not bake flags into the JWT. They change too often and JWT lifetime is too long.

## Cross-tenant data leak via search results

Search endpoints (worker search, job search, full-text search) MUST scope by `tenant_id` in both the database query AND any auxiliary search index (Postgres FTS column, future Meilisearch, etc.).

**Test:** build the FTS index for two tenants and assert no Tenant B docs returned for Tenant A queries — this is in the integration test suite as `cross-tenant-search.test.ts`.

## Test database isolation

Each integration test creates a fresh tenant and uses it for the test, then deletes. Avoid sharing a tenant across tests — order-dependent failures are extremely hard to debug. Helper:

```ts
// apps/api/test/helpers/tenant.ts
export async function withTestTenant<T>(fn: (tenantId: string) => Promise<T>): Promise<T> {
    const tenant = await db.tenant.create({ data: { slug: `test-${nanoid(8)}`, name: 'Test', plan: 'starter' } });
    try {
        return await fn(tenant.id);
    } finally {
        await db.tenant.delete({ where: { id: tenant.id } });
    }
}
```

## Soft-delete cascade

Soft-deleting a tenant does not cascade to child rows. This is intentional — restoration must put the tenant back in a usable state. However:

- All child queries already filter `deletedAt is null` on their own rows; tenant `deletedAt` blocks at the auth gate.
- A nightly job (`cleanup-tenants`) can hard-delete tenants soft-deleted > 90 days ago, including all child rows, after admin confirmation. Out of scope for MVP.

## Performance: tenant filter cardinality

With one tenant in MVP, every row has the same `tenant_id`, so the index is useless until tenant #2 exists. Postgres handles this gracefully (the planner falls back to seq scan when the column is non-selective), but specific query plans should be reviewed when tenant #2 is added — composite indexes may need re-ordering.

## Compliance: data residency

US-only deployment in MVP (Azure US East 2 or US West 2). If a future tenant requires EU residency, the architecture supports a separate AKS cluster with its own Postgres in the EU region — tenant-per-cluster, not tenant-per-row. The `tenants` table is local to each cluster. Out of scope for MVP.

## Open questions

1. Tenant onboarding workflow — is creating a tenant a self-service flow for partner orgs, or fully admin-mediated? (Recommendation: admin-mediated for MVP.)
2. Per-tenant subdomain vs. path-prefix routing — `central-valley.agconn.com` vs. `agconn.com/central-valley`. Subdomain is cleaner for branding; path-prefix is simpler for ops. Pick before tenant #2.
