import { Hono } from 'hono';
import { z } from 'zod';
import { ok, err, validate } from '@agconn/api-client/server';
import type { AdminOrgVars } from '../../middleware/adminClerkAuth.js';
import type { AuditCtxVars } from '../../middleware/audit.js';

// Code defaults: keys we know about so the admin UI can present a stable
// matrix even when no row exists yet. Source of truth for "what flags exist".
const KNOWN_FLAGS = [
  { key: 'employer.payroll.export', label: 'Employer payroll CSV export' },
  { key: 'employer.weather.banner', label: 'Weather banner on employer home' },
  { key: 'worker.field_mode', label: 'Worker field mode shell' },
  { key: 'worker.savedsearch.daily', label: 'Daily saved-search digest SMS' },
  { key: 'sms.opt_in_sms_keyword', label: 'Inbound SMS keyword onboarding' },
  { key: 'training.cert_generation', label: 'Async certificate PDF generation' },
  { key: 'admin.translations.tenant_overrides', label: 'Per-tenant translation overrides' },
  { key: 'admin.bulk_export', label: 'Bulk PII export for admins' },
] as const;

export const adminFlagsRoutes = new Hono<{ Variables: AdminOrgVars & AuditCtxVars }>();

adminFlagsRoutes.get('/', async (c) => {
  const rows = await c.var.db.featureFlag.findMany({
    orderBy: [{ key: 'asc' }, { tenantId: { sort: 'asc', nulls: 'first' } }],
    include: { tenant: { select: { id: true, slug: true, name: true } } },
  });

  const tenants = await c.var.db.tenant.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, name: true },
    orderBy: { name: 'asc' },
  });

  type FlagRow = (typeof rows)[number];
  const byKey = new Map<string, { platform: FlagRow | null; tenants: FlagRow[] }>();
  for (const r of rows) {
    const bucket = byKey.get(r.key) ?? { platform: null, tenants: [] };
    if (r.tenantId === null) bucket.platform = r;
    else bucket.tenants.push(r);
    byKey.set(r.key, bucket);
  }

  const seen = new Set<string>(byKey.keys());
  for (const k of KNOWN_FLAGS) if (!seen.has(k.key)) byKey.set(k.key, { platform: null, tenants: [] });

  const knownLabel = new Map<string, string>(KNOWN_FLAGS.map((k) => [k.key, k.label]));

  const flags = [...byKey.entries()]
    .map(([key, bucket]) => ({
      key,
      label: knownLabel.get(key) ?? key,
      platform: bucket.platform
        ? {
            id: bucket.platform.id,
            enabled: bucket.platform.enabled,
            notes: bucket.platform.notes,
            updatedAt: bucket.platform.updatedAt.toISOString(),
          }
        : null,
      tenantOverrides: bucket.tenants.map((t) => ({
        id: t.id,
        tenantId: t.tenantId!,
        tenantSlug: t.tenant?.slug ?? '—',
        tenantName: t.tenant?.name ?? '—',
        enabled: t.enabled,
        notes: t.notes,
        updatedAt: t.updatedAt.toISOString(),
      })),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

  return ok(c, { flags, tenants });
});

const upsertBody = z
  .object({
    key: z.string().min(1).max(120),
    tenantId: z.string().uuid().nullable(),
    enabled: z.boolean(),
    notes: z.string().max(500).nullable().optional(),
  })
  .strict();

adminFlagsRoutes.put('/', validate('json', upsertBody), async (c) => {
  const b = c.var.body;
  const existing = await c.var.db.featureFlag.findFirst({
    where: { key: b.key, tenantId: b.tenantId },
  });

  const row = existing
    ? await c.var.db.featureFlag.update({
        where: { id: existing.id },
        data: { enabled: b.enabled, notes: b.notes ?? null, updatedBy: c.var.userId ?? null },
      })
    : await c.var.db.featureFlag.create({
        data: {
          key: b.key,
          tenantId: b.tenantId,
          enabled: b.enabled,
          notes: b.notes ?? null,
          updatedBy: c.var.userId ?? null,
        },
      });

  await c.var.audit.log({
    action: 'admin.flag.updated',
    resourceType: 'feature_flag',
    resourceId: row.id,
    metadata: {
      key: b.key,
      tenantScope: b.tenantId ?? 'platform',
      enabledBefore: existing?.enabled ?? null,
      enabledAfter: b.enabled,
    },
  });

  return ok(c, {
    id: row.id,
    key: row.key,
    tenantId: row.tenantId,
    enabled: row.enabled,
    notes: row.notes,
    updatedAt: row.updatedAt.toISOString(),
  });
});

adminFlagsRoutes.delete('/:id', async (c) => {
  if (c.var.orgRole !== 'org:super_admin') {
    return err(c, 403, 'forbidden', 'super_admin required to delete flag override');
  }
  const id = c.req.param('id');
  const existing = await c.var.db.featureFlag.findUnique({ where: { id } });
  if (!existing) return err(c, 404, 'not_found');

  await c.var.db.featureFlag.delete({ where: { id } });
  await c.var.audit.log({
    action: 'admin.flag.deleted',
    resourceType: 'feature_flag',
    resourceId: id,
    metadata: { key: existing.key, tenantScope: existing.tenantId ?? 'platform' },
  });

  return ok(c, { deleted: true });
});
