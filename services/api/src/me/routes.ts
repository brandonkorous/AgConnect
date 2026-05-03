import { Hono } from 'hono';
import { ok, err } from '@agconn/api-client/server';
import { requireAuth, type AuthVars } from '../middleware/authContext';
import type { AuditCtxVars } from '../middleware/audit';

// /v1/me/* — the authenticated session inspection surface.
//
// Phase 0 DoD requires that /v1/me/tenant resolves the caller's tenant from
// the Clerk session (never trusting a client-supplied tenant_id), and that
// any attempt to coerce a different tenant via query param or header is
// rejected with a 403 AND an `auth.tenant.access_denied` audit row.

export const meRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();

meRoutes.use('*', requireAuth);

// Returns user role + tenant if any. Unlike /tenant below, this does NOT 403
// when tenantId is null — a freshly-created employer has no tenant yet, and
// the post-auth router still needs the role to pick the right destination.
meRoutes.get('/', async (c) => {
  const tenantId = c.var.tenantId;
  const tenant = tenantId
    ? await c.var.db.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, slug: true, name: true, isPublic: true },
      })
    : null;
  return ok(c, {
    user: { id: c.var.userId, role: c.var.userRole },
    tenant,
  });
});

meRoutes.get('/tenant', async (c) => {
  const tenantId = c.var.tenantId;

  // Cross-tenant probe: if the client supplies a tenant id (query or header)
  // and it doesn't match the resolved one, refuse and audit.
  const probedHeader = c.req.header('x-tenant-id');
  const probedQuery = c.req.query('tenantId');
  const probed = probedHeader ?? probedQuery ?? null;

  if (probed && probed !== tenantId) {
    await c.var.audit.log({
      action: 'auth.tenant.access_denied',
      resourceType: 'tenant',
      resourceId: probed,
      outcome: 'failure',
      metadata: {
        requestedTenantId: probed,
        reason: 'cross_tenant_probe',
      },
    });
    return err(c, 403, 'forbidden', 'Cross-tenant access denied');
  }

  if (!tenantId) {
    return err(c, 403, 'no_tenant', 'User has no tenant assigned');
  }

  const tenant = await c.var.db.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true, name: true, isPublic: true },
  });
  if (!tenant) {
    return err(c, 404, 'not_found', 'Tenant not found');
  }

  return ok(c, {
    user: {
      id: c.var.userId,
      role: c.var.userRole,
    },
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      isPublic: tenant.isPublic,
    },
  });
});
