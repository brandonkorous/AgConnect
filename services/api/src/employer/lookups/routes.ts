// Read-only lookup endpoints — feed the Edit Job form's crop chips, role
// dropdown, and skill rail. Cached at the CDN/edge in front of the API; here
// we just return the active rows.

import { Hono } from 'hono';
import { ok } from '@agconn/api-client/server';
import { requireAuth, requireRole, type AuthVars } from '../../middleware/authContext';
import type { AuditCtxVars } from '../../middleware/audit';

export const employerLookupsRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerLookupsRoutes.use('*', requireAuth('employer'));
employerLookupsRoutes.use('*', requireRole('employer'));

employerLookupsRoutes.get('/crops', async (c) => {
  const rows = await c.var.db.crop.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  });
  c.header('Cache-Control', 'private, max-age=300');
  return ok(c, { crops: rows.map(stripTimestamps) });
});

employerLookupsRoutes.get('/role-types', async (c) => {
  const rows = await c.var.db.roleType.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  });
  c.header('Cache-Control', 'private, max-age=300');
  return ok(c, { roleTypes: rows.map(stripTimestamps) });
});

employerLookupsRoutes.get('/skills', async (c) => {
  const rows = await c.var.db.skillTag.findMany({
    where: { active: true },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  });
  c.header('Cache-Control', 'private, max-age=300');
  return ok(c, { skills: rows.map(stripTimestamps) });
});

function stripTimestamps<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  const { createdAt: _c, updatedAt: _u, ...rest } = row;
  return rest;
}
