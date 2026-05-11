import { Hono } from 'hono';
import { z } from 'zod';
import { ok, err, validate } from '@agconn/api-client/server';
import type { AdminOrgVars } from '../../middleware/adminClerkAuth.js';
import type { AuditCtxVars } from '../../middleware/audit.js';

// Lookup-table CRUD: Crop, RoleType, SkillTag. These are platform-level
// reference data — used to populate dropdowns on the marketing job form,
// employer onboarding, and worker profile. Mutation requires admin role;
// destructive operations require super_admin.

export const adminLookupsRoutes = new Hono<{ Variables: AdminOrgVars & AuditCtxVars }>();

const TABLES = ['crops', 'role-types', 'skill-tags'] as const;
type TableSlug = (typeof TABLES)[number];

function tableOf(slug: string): TableSlug | null {
  return (TABLES as readonly string[]).includes(slug) ? (slug as TableSlug) : null;
}

const baseRowBody = {
  slug: z.string().min(1).max(80),
  labelEn: z.string().min(1).max(120),
  labelEs: z.string().min(1).max(120),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
};

const cropBody = z.object({ ...baseRowBody, glyphKey: z.string().min(1).max(60) }).strict();
const roleTypeBody = z.object(baseRowBody).strict();
const skillTagBody = z.object({ ...baseRowBody, category: z.string().min(1).max(40).default('general') }).strict();

adminLookupsRoutes.get('/:table', async (c) => {
  const t = tableOf(c.req.param('table'));
  if (!t) return err(c, 404, 'not_found');

  if (t === 'crops') {
    const rows = await c.var.db.crop.findMany({ orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }] });
    return ok(c, { rows });
  }
  if (t === 'role-types') {
    const rows = await c.var.db.roleType.findMany({
      orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
    });
    return ok(c, { rows });
  }
  const rows = await c.var.db.skillTag.findMany({
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { slug: 'asc' }],
  });
  return ok(c, { rows });
});

adminLookupsRoutes.post('/:table', async (c) => {
  const t = tableOf(c.req.param('table'));
  if (!t) return err(c, 404, 'not_found');
  const json = await c.req.json().catch(() => null);
  if (!json) return err(c, 422, 'validation_failed', 'invalid json');

  if (t === 'crops') {
    const parsed = cropBody.safeParse(json);
    if (!parsed.success) return err(c, 422, 'validation_failed', parsed.error.message);
    const row = await c.var.db.crop.create({ data: parsed.data });
    await c.var.audit.log({
      action: 'admin.lookup.created',
      resourceType: 'lookup_row',
      resourceId: row.id,
      metadata: { table: 'crops', slug: row.slug },
    });
    return ok(c, { row });
  }
  if (t === 'role-types') {
    const parsed = roleTypeBody.safeParse(json);
    if (!parsed.success) return err(c, 422, 'validation_failed', parsed.error.message);
    const row = await c.var.db.roleType.create({ data: parsed.data });
    await c.var.audit.log({
      action: 'admin.lookup.created',
      resourceType: 'lookup_row',
      resourceId: row.id,
      metadata: { table: 'role-types', slug: row.slug },
    });
    return ok(c, { row });
  }
  const parsed = skillTagBody.safeParse(json);
  if (!parsed.success) return err(c, 422, 'validation_failed', parsed.error.message);
  const row = await c.var.db.skillTag.create({ data: parsed.data });
  await c.var.audit.log({
    action: 'admin.lookup.created',
    resourceType: 'lookup_row',
    resourceId: row.id,
    metadata: { table: 'skill-tags', slug: row.slug },
  });
  return ok(c, { row });
});

const patchBody = z
  .object({
    labelEn: z.string().min(1).max(120).optional(),
    labelEs: z.string().min(1).max(120).optional(),
    sortOrder: z.number().int().min(0).max(9999).optional(),
    active: z.boolean().optional(),
    glyphKey: z.string().min(1).max(60).optional(),
    category: z.string().min(1).max(40).optional(),
  })
  .strict();

adminLookupsRoutes.patch('/:table/:id', validate('json', patchBody), async (c) => {
  const t = tableOf(c.req.param('table'));
  if (!t) return err(c, 404, 'not_found');
  const id = c.req.param('id');
  const b = c.var.body;
  const fields = Object.keys(b);

  if (t === 'crops') {
    const row = await c.var.db.crop.update({ where: { id }, data: b });
    await c.var.audit.log({
      action: 'admin.lookup.updated',
      resourceType: 'lookup_row',
      resourceId: id,
      metadata: { table: 'crops', slug: row.slug, fields },
    });
    return ok(c, { row });
  }
  if (t === 'role-types') {
    const row = await c.var.db.roleType.update({
      where: { id },
      data: { labelEn: b.labelEn, labelEs: b.labelEs, sortOrder: b.sortOrder, active: b.active },
    });
    await c.var.audit.log({
      action: 'admin.lookup.updated',
      resourceType: 'lookup_row',
      resourceId: id,
      metadata: { table: 'role-types', slug: row.slug, fields },
    });
    return ok(c, { row });
  }
  const row = await c.var.db.skillTag.update({ where: { id }, data: b });
  await c.var.audit.log({
    action: 'admin.lookup.updated',
    resourceType: 'lookup_row',
    resourceId: id,
    metadata: { table: 'skill-tags', slug: row.slug, fields },
  });
  return ok(c, { row });
});

adminLookupsRoutes.delete('/:table/:id', async (c) => {
  if (c.var.orgRole !== 'org:super_admin') {
    return err(c, 403, 'forbidden', 'super_admin required to delete lookup row');
  }
  const t = tableOf(c.req.param('table'));
  if (!t) return err(c, 404, 'not_found');
  const id = c.req.param('id');

  let slug = '';
  if (t === 'crops') {
    const r = await c.var.db.crop.delete({ where: { id } });
    slug = r.slug;
  } else if (t === 'role-types') {
    const r = await c.var.db.roleType.delete({ where: { id } });
    slug = r.slug;
  } else {
    const r = await c.var.db.skillTag.delete({ where: { id } });
    slug = r.slug;
  }
  await c.var.audit.log({
    action: 'admin.lookup.deleted',
    resourceType: 'lookup_row',
    resourceId: id,
    metadata: { table: t, slug },
  });
  return ok(c, { deleted: true });
});
