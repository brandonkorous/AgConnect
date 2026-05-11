import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { Lang, TranslationStatus } from '@agconn/db';
import {
  clerkAdminAuthMiddleware,
  requireAdminOrg,
  type AdminOrgVars,
} from '../../middleware/adminClerkAuth.js';
import type { AuditCtxVars } from '../../middleware/audit.js';
import {
  listTranslationsQuery,
  updateTranslationBody,
  createTranslationBody,
} from './schemas.js';
import { listTranslations, listNamespaces } from './service.js';
import { revalidateTranslations } from './revalidate.js';

export const adminTranslationsRoutes = new Hono<{
  Variables: AdminOrgVars & AuditCtxVars;
}>();

adminTranslationsRoutes.use('*', clerkAdminAuthMiddleware);
adminTranslationsRoutes.use('*', requireAdminOrg('admin'));

adminTranslationsRoutes.get('/namespaces', async (c) => {
  const scope = (c.req.query('scope') ?? 'platform') as 'platform' | 'tenant';
  const namespaces = await listNamespaces(c.var.db, scope, c.var.tenantId);
  return ok(c, { namespaces });
});

adminTranslationsRoutes.get(
  '/',
  validate('query', listTranslationsQuery),
  async (c) => {
    const q = c.var.body;
    const result = await listTranslations(c.var.db, {
      scope: q.scope,
      tenantId: q.tenantId ?? c.var.tenantId ?? undefined,
      namespace: q.namespace,
      search: q.search,
      status: q.status,
      missingOnly: q.missingOnly,
      limit: q.limit,
      cursor: q.cursor,
    });
    return ok(c, result);
  },
);

adminTranslationsRoutes.patch(
  '/:id',
  validate('json', updateTranslationBody),
  async (c) => {
    const id = c.req.param('id');
    const { value } = c.var.body;

    const existing = await c.var.db.translationKey.findUnique({ where: { id } });
    if (!existing) return err(c, 404, 'not_found');

    const updated = await c.var.db.translationKey.update({
      where: { id },
      data: {
        value,
        status: TranslationStatus.published,
        publishedAt: new Date(),
        reviewedBy: c.var.userId,
        reviewedAt: new Date(),
      },
    });

    await c.var.audit.log({
      action: 'admin.translation.updated',
      resourceType: 'translation_key',
      resourceId: id,
      metadata: {
        namespace: existing.namespace,
        key: existing.key,
        locale: existing.locale,
        tenantScope: existing.tenantId ?? 'platform',
        valueBytes: value.length,
      },
    });

    await revalidateTranslations({
      tenantId: existing.tenantId,
      locale: existing.locale as 'en' | 'es',
    });

    return ok(c, {
      id: updated.id,
      value: updated.value,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    });
  },
);

adminTranslationsRoutes.post(
  '/',
  validate('json', createTranslationBody),
  async (c) => {
    const body = c.var.body;
    const tenantId = body.scope === 'platform' ? null : (body.tenantId ?? c.var.tenantId);
    if (body.scope === 'tenant' && !tenantId) {
      return err(c, 422, 'validation_failed', 'tenantId required for tenant scope');
    }

    if (!body.valueEn && !body.valueEs) {
      return err(c, 422, 'validation_failed', 'at least one of valueEn or valueEs required');
    }

    const created: { id: string; locale: Lang }[] = [];
    for (const [locale, value] of [
      [Lang.en, body.valueEn],
      [Lang.es, body.valueEs],
    ] as const) {
      if (!value) continue;
      const row = await c.var.db.translationKey.create({
        data: {
          tenantId,
          namespace: body.namespace,
          key: body.key,
          locale,
          value,
          status: TranslationStatus.published,
          publishedAt: new Date(),
          reviewedBy: c.var.userId,
          reviewedAt: new Date(),
        },
        select: { id: true, locale: true },
      });
      created.push(row);

      await c.var.audit.log({
        action: 'admin.translation.created',
        resourceType: 'translation_key',
        resourceId: row.id,
        metadata: {
          namespace: body.namespace,
          key: body.key,
          locale,
          tenantScope: tenantId ?? 'platform',
        },
      });
    }

    await revalidateTranslations({ tenantId });
    return ok(c, { created });
  },
);

adminTranslationsRoutes.delete('/:id', async (c) => {
  if (c.var.orgRole !== 'org:super_admin') {
    return err(c, 403, 'forbidden', 'super_admin required for delete');
  }
  const id = c.req.param('id');
  const existing = await c.var.db.translationKey.findUnique({ where: { id } });
  if (!existing) return err(c, 404, 'not_found');

  await c.var.db.translationKey.delete({ where: { id } });

  await c.var.audit.log({
    action: 'admin.translation.deleted',
    resourceType: 'translation_key',
    resourceId: id,
    metadata: {
      namespace: existing.namespace,
      key: existing.key,
      locale: existing.locale,
      tenantScope: existing.tenantId ?? 'platform',
    },
  });

  await revalidateTranslations({
    tenantId: existing.tenantId,
    locale: existing.locale as 'en' | 'es',
  });

  return ok(c, { id });
});
