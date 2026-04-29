# 01 — Multi-tenancy: Acceptance Criteria

## Functional

- [ ] A worker authenticated under Tenant A cannot read any row owned by Tenant B via any API endpoint.
- [ ] A worker authenticated under Tenant A cannot insert a row claiming Tenant B's `tenant_id` (RLS `WITH CHECK` rejects).
- [ ] An employer Clerk org maps to exactly one tenant; cross-tenant access is impossible.
- [ ] Admin endpoints under `/admin/v1/*` require `userRole === 'admin'`; non-admins receive `403 not_admin`.
- [ ] Background pg-boss jobs always pass `tenantId` explicitly; the worker sets `app.tenant_id` before any query.
- [ ] Soft-deleting a tenant immediately blocks all auth resolution for that tenant's users (next request → `403 tenant_disabled`).
- [ ] Restoring a soft-deleted tenant immediately re-enables access for all its users without further action.
- [ ] `GET /v1/me/tenant` returns the caller's tenant (never another tenant's data).
- [ ] Creating a new tenant requires zero code changes — only `POST /admin/v1/tenants` + Clerk Organization setup.

## Non-functional

- [ ] Adding `tenant_id` to a query path adds < 2ms (validated with `EXPLAIN ANALYZE` on a 1M-row table).
- [ ] No N+1 tenant lookups: tenant resolved once per request, cached on Hono context.
- [ ] Connection-pool transaction lifecycle: `SET LOCAL app.tenant_id` does not leak to the next pooled query (verified by integration test that checks pool reuse).

## Test scenarios

### Unit

1. `tenantMiddleware` rejects unauthenticated → `401 unauthenticated`.
2. `tenantMiddleware` rejects authenticated user with no tenant mapping → `403 no_tenant`.
3. `tenantMiddleware` rejects soft-deleted tenant → `403 tenant_disabled`.

### Integration

1. **Cross-tenant read:** seed two tenants with one job posting each. Authenticate as Tenant A worker. `GET /v1/jobs/:tenantBJobId` returns `404` (RLS hides the row, not 403, to avoid existence disclosure).
2. **Cross-tenant insert attempt:** craft a request that omits client-side tenant ref but the API attempts to insert with the wrong `tenant_id`. RLS `WITH CHECK` rejects → 500 mapped to `internal_error` (this case should never happen in real client code; this is a defense test).
3. **Admin bypass:** admin `GET /admin/v1/tenants/X/jobs` returns Tenant X jobs even though admin's own session has no tenant.
4. **Disabled tenant:** soft-delete Tenant A. Existing user session next request → `403 tenant_disabled`.
5. **Connection pool isolation:** under load (100 concurrent requests across 5 tenants), assert no request reads or writes another tenant's data.

### Manual

1. Create a second tenant via admin UI. Invite a user to its Clerk Organization. Confirm that user sees only the new tenant's data.
2. Restore a deleted tenant. Confirm all its users regain access immediately.

## Definition of done

- All RLS policies present on every tenant-scoped table — verified by a CI script that introspects `pg_policy` and asserts coverage.
- A linter/Prisma generator script (`packages/db/scripts/check-tenant-id.ts`) fails the build if any new model is missing `tenantId` (allowlist for `Tenant`, `MigrationLog`).
- Test coverage > 90% on `tenantMiddleware` and admin tenant CRUD.
- Sentry breadcrumb on every tenant resolution (`tenantId`, `userRole`) for incident debugging.
