# 01 — Multi-tenancy: API Surface

## Tenant resolution middleware

Every authenticated request resolves the tenant once at the gateway and stores it on the Hono context. The Postgres session variables are set inside a per-request transaction so RLS sees them.

```ts
// apps/api/src/middleware/tenant.ts
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { getAuth } from '@hono/clerk-auth';
import { db } from '@agconn/db';

type Vars = { tenantId: string; userRole: 'worker' | 'employer' | 'training_org' | 'admin' };

export const tenantMiddleware = createMiddleware<{ Variables: Vars }>(async (c, next) => {
    const auth = getAuth(c);
    if (!auth?.userId) throw new HTTPException(401, { message: 'unauthenticated' });

    const orgId = auth.orgId ?? null;
    const role = (auth.sessionClaims?.publicMetadata as any)?.role as Vars['userRole'];

    const tenant = orgId ? await db.tenant.findFirst({ where: { clerkOrgId: orgId, deletedAt: null } }) : await resolveTenantFromUser(auth.userId);

    if (!tenant) throw new HTTPException(403, { message: 'no_tenant' });

    c.set('tenantId', tenant.id);
    c.set('userRole', role);

    await db.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenant.id}'`);
        await tx.$executeRawUnsafe(`SET LOCAL app.role = '${role}'`);
        await tx.$executeRawUnsafe(`SET LOCAL app.user_id = '${auth.userId}'`);
        c.set('db', tx);
        await next();
    });
});

async function resolveTenantFromUser(clerkUserId: string) {
    const user = await db.user.findUnique({
        where: { id: clerkUserId },
        include: { tenant: true },
    });
    return user?.tenant && !user.tenant.deletedAt ? user.tenant : null;
}
```

> **Inferred:** Using `$executeRawUnsafe` with interpolation is safe here because both `tenant.id` and `role` are server-controlled (UUID from DB, enum from Clerk metadata that we set ourselves). Do not pass user input through this pattern. The transaction-scoped pattern (`SET LOCAL` inside `$transaction`) ensures connection pool reuse doesn't leak tenant context.

## Mounting

```ts
// apps/api/src/index.ts
const api = new Hono();
api.use('*', clerkMiddleware());
api.use('/v1/*', tenantMiddleware); // tenant-scoped routes
api.route('/v1/jobs', jobsRouter);
api.route('/v1/applications', applicationsRouter);
api.route('/admin/v1', adminRouter); // admin routes use adminMiddleware (RLS bypass) instead
```

## Admin tenant CRUD

All endpoints below require `userRole === 'admin'` and run with `app.role = 'admin'` (RLS bypass). They live under `/admin/v1/tenants/*`.

### POST /admin/v1/tenants

Create a new tenant.

Request:

```ts
const CreateTenantBody = z.object({
    slug: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .min(3)
        .max(40),
    name: z.string().min(1).max(120),
    plan: z.enum(['starter', 'pro', 'enterprise']).default('starter'),
    clerkOrgId: z.string().optional(),
    settings: TenantSettingsSchema.optional(),
});
```

Response: `200` with the created tenant. `409` if slug or `clerkOrgId` already exist.

### GET /admin/v1/tenants

List tenants. Query params: `?plan=pro&q=valley&includeDeleted=false`.

Response: `{ tenants: Tenant[]; total: number }`. Pagination via `?cursor=<id>&limit=50`.

### GET /admin/v1/tenants/:id

Get a single tenant including current user counts (`{ workers, employers, trainingOrgs, total }`) and current month metrics (`{ activePostings, applications, hires }`).

### PATCH /admin/v1/tenants/:id

Update tenant. `slug` is **immutable** after create. Body matches the create schema with all fields optional except `slug`.

```ts
const UpdateTenantBody = z.object({
    name: z.string().min(1).max(120).optional(),
    plan: z.enum(['starter', 'pro', 'enterprise']).optional(),
    clerkOrgId: z.string().optional(),
    settings: TenantSettingsSchema.optional(),
});
```

### DELETE /admin/v1/tenants/:id

Soft-delete (`deletedAt = now()`). All tenant-scoped data remains; access is blocked at the auth layer because Clerk org → tenant lookup will fail with `tenant_disabled`.

### POST /admin/v1/tenants/:id/restore

Clear `deletedAt`. Restores all access.

## Client API surface (tenant-scoped)

Non-admin clients never call tenant endpoints directly. The current tenant is exposed read-only via:

### GET /v1/me/tenant

Response:

```ts
z.object({
    id: z.string().uuid(),
    slug: z.string(),
    name: z.string(),
    plan: z.enum(['starter', 'pro', 'enterprise']),
    branding: TenantSettingsSchema.shape.branding.optional(),
});
```

Used by the web app for branding and footer NAP (name/address/phone).

## Errors

| code              | http | when                                                      |
| ----------------- | ---- | --------------------------------------------------------- |
| `unauthenticated` | 401  | No Clerk session                                          |
| `no_tenant`       | 403  | Authenticated but Clerk org / user not mapped to a tenant |
| `tenant_disabled` | 403  | Tenant exists but `deletedAt is not null`                 |
| `slug_taken`      | 409  | Tenant create with existing slug                          |
| `clerk_org_taken` | 409  | Tenant create with existing `clerkOrgId`                  |
| `not_admin`       | 403  | Non-admin hitting `/admin/v1/*`                           |
