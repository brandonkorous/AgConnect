import { Hono } from 'hono';
import { ok, validate } from '@agconn/api-client/server';
import {
  clerkAdminAuthMiddleware,
  requireAdminOrg,
  type AdminOrgVars,
} from '../../middleware/adminClerkAuth.js';
import type { AuditCtxVars } from '../../middleware/audit.js';
import { kpiQuery } from './schemas.js';
import { buildKpiSummary } from './service.js';

export const adminKpiRoutes = new Hono<{ Variables: AdminOrgVars & AuditCtxVars }>();

adminKpiRoutes.use('*', clerkAdminAuthMiddleware);
adminKpiRoutes.use('*', requireAdminOrg('admin'));

adminKpiRoutes.get('/summary', validate('query', kpiQuery), async (c) => {
  const q = c.var.body;
  const summary = await buildKpiSummary(c.var.db, q);
  return ok(c, summary);
});
