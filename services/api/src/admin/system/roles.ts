import { Hono } from 'hono';
import { z } from 'zod';
import { ok, err, validate } from '@agconn/api-client/server';
import { PERMISSIONS } from '@agconn/schemas';
import type { AdminOrgVars } from '../../middleware/adminClerkAuth.js';
import type { AuditCtxVars } from '../../middleware/audit.js';

// Platform-managed employer role catalog. tenant_id NULL = global (the only
// mode used today). The PERMISSIONS list is shipped to the admin UI so it can
// render a stable permission matrix. Mirrors the admin feature-flags route.

export const adminRolesRoutes = new Hono<{ Variables: AdminOrgVars & AuditCtxVars }>();

adminRolesRoutes.get('/', async (c) => {
  const rows = await c.var.db.role.findMany({
    where: { deletedAt: null },
    orderBy: [{ tenantId: { sort: 'asc', nulls: 'first' } }, { key: 'asc' }],
  });
  return ok(c, {
    permissions: PERMISSIONS,
    roles: rows.map((r) => ({
      id: r.id,
      key: r.key,
      tenantId: r.tenantId,
      permissions: r.permissions,
      scopeQualifier: r.scopeQualifier,
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
});

const upsertBody = z
  .object({
    key: z
      .string()
      .min(2)
      .max(40)
      .regex(/^[a-z][a-z0-9_]*$/),
    tenantId: z.string().uuid().nullable(),
    permissions: z.array(z.string().min(1).max(60)).max(64),
    scopeQualifier: z.enum(['self_crew']).nullable().optional(),
  })
  .strict();

adminRolesRoutes.put('/', validate('json', upsertBody), async (c) => {
  const b = c.var.body;
  const existing = await c.var.db.role.findFirst({
    where: { key: b.key, tenantId: b.tenantId, deletedAt: null },
  });

  const row = existing
    ? await c.var.db.role.update({
        where: { id: existing.id },
        data: { permissions: b.permissions, scopeQualifier: b.scopeQualifier ?? null },
      })
    : await c.var.db.role.create({
        data: {
          key: b.key,
          tenantId: b.tenantId,
          permissions: b.permissions,
          scopeQualifier: b.scopeQualifier ?? null,
        },
      });

  await c.var.audit.log({
    action: 'admin.role.updated',
    resourceType: 'role',
    resourceId: row.id,
    metadata: { key: b.key, tenantScope: b.tenantId ?? 'platform' },
  });

  return ok(c, {
    id: row.id,
    key: row.key,
    tenantId: row.tenantId,
    permissions: row.permissions,
    scopeQualifier: row.scopeQualifier,
    updatedAt: row.updatedAt.toISOString(),
  });
});

adminRolesRoutes.delete('/:id', async (c) => {
  if (c.var.orgRole !== 'org:super_admin') {
    return err(c, 403, 'forbidden', 'super_admin required to delete a role');
  }
  const id = c.req.param('id');
  const existing = await c.var.db.role.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) return err(c, 404, 'not_found');
  if (existing.key === 'owner') {
    return err(c, 409, 'protected', 'the owner role cannot be deleted');
  }

  // Block deletion while members still hold the role — they would lose all
  // access (role_id is NOT NULL). The operator must reassign first.
  const inUse = await c.var.db.employerContact.count({
    where: { roleId: id, deletedAt: null },
  });
  if (inUse > 0) {
    return err(c, 409, 'role_in_use', `${inUse} member(s) still hold this role`);
  }

  await c.var.db.role.update({ where: { id }, data: { deletedAt: new Date() } });
  await c.var.audit.log({
    action: 'admin.role.deleted',
    resourceType: 'role',
    resourceId: id,
    metadata: { key: existing.key },
  });
  return ok(c, { deleted: true });
});
