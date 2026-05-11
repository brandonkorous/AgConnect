import { Hono } from 'hono';
import { ok } from '@agconn/api-client/server';
import {
  clerkAdminAuthMiddleware,
  requireAdminOrg,
  type AdminOrgVars,
} from '../../middleware/adminClerkAuth.js';
import type { AuditCtxVars } from '../../middleware/audit.js';

export const adminMeRoutes = new Hono<{ Variables: AdminOrgVars & AuditCtxVars }>();

adminMeRoutes.use('*', clerkAdminAuthMiddleware);
adminMeRoutes.use('*', requireAdminOrg('admin'));

// Identity + impersonable tenants for the admin shell. No audit log on read —
// session reads are noisy and Clerk emits sign-in events independently.
// Mutating admin actions log via the existing audit middleware.
adminMeRoutes.get('/', async (c) => {
  const tenants = await c.var.db.tenant.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, name: true },
    orderBy: { name: 'asc' },
  });

  return ok(c, {
    user: {
      id: c.var.userId,
      orgId: c.var.orgId,
      orgRole: c.var.orgRole,
    },
    activeTenantId: c.var.tenantId,
    tenants,
  });
});
