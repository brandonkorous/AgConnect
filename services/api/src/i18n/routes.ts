// Public i18n endpoint — serves the assembled translation tree for a locale.
//
// Apps (web, admin) hit GET /v1/i18n/messages?locale=en at SSR time to
// render localized chrome. Returning the entire tree per request is fine in
// dev; in production a 5-minute Cache-Control + a CDN edge keep the cost low.
//
// Tenant-scoped overrides: when a tenant ID is supplied, tenant rows merge on
// top of globals (deep merge by namespace.key). Without a tenant ID, only
// global rows are returned.
//
// We pin `app.role = 'admin'` in the transaction because the RLS policy on
// translation_keys only allows admin to read. The endpoint itself is public
// — anyone can fetch the message tree, by design.

import { Hono } from 'hono';
import { z } from 'zod';
import { ok, err, validate } from '@agconn/api-client/server';
import { pools, Lang, TranslationStatus } from '@agconn/db';

export const i18nRoutes = new Hono();

const messagesQuerySchema = z.object({
  locale: z.enum(['en', 'es']),
  tenantId: z.string().uuid().optional(),
});

type Messages = Record<string, unknown>;

interface Row {
  namespace: string;
  key: string;
  value: string;
  tenantId?: string | null;
}

function assemble(rows: Row[]): Messages {
  const root: Messages = {};
  for (const row of rows) {
    const path = [...row.namespace.split('.'), ...row.key.split('.')];
    let cursor: Messages = root;
    for (let i = 0; i < path.length - 1; i++) {
      const segment = path[i];
      if (!segment) continue;
      const next = cursor[segment];
      if (typeof next !== 'object' || next === null || Array.isArray(next)) {
        cursor[segment] = {};
      }
      cursor = cursor[segment] as Messages;
    }
    const leaf = path[path.length - 1];
    if (leaf) cursor[leaf] = row.value;
  }
  return root;
}

function assembleDeepMerge(globals: Row[], overrides: Row[]): Messages {
  const merged = new Map<string, Row>();
  for (const r of globals) merged.set(`${r.namespace}|${r.key}`, r);
  for (const r of overrides) merged.set(`${r.namespace}|${r.key}`, r);
  return assemble(Array.from(merged.values()));
}

i18nRoutes.get('/messages', validate('query', messagesQuerySchema), async (c) => {
  const { locale, tenantId } = c.var.body;

  try {
    const messages = await pools.i18n.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
        if (!tenantId) {
          const rows = await tx.translationKey.findMany({
            where: {
              locale: locale as Lang,
              tenantId: null,
              status: TranslationStatus.published,
            },
            select: { namespace: true, key: true, value: true },
          });
          return assemble(rows);
        }

        const rows = await tx.translationKey.findMany({
          where: {
            locale: locale as Lang,
            status: TranslationStatus.published,
            OR: [{ tenantId }, { tenantId: null }],
          },
          orderBy: [{ tenantId: 'asc' }],
          select: { namespace: true, key: true, value: true, tenantId: true },
        });

        const globals = rows.filter((r) => r.tenantId === null);
        const overrides = rows.filter((r) => r.tenantId !== null);
        return { ...assemble(globals), ...assembleDeepMerge(globals, overrides) };
      },
      { timeout: 15_000, maxWait: 5_000 },
    );

    // Cache-Control: 5 minutes shared cache. Translation reseeds bump the
    // updated_at on rows but the endpoint doesn't ETag yet — punted.
    c.header('Cache-Control', 'public, max-age=300, s-maxage=300');
    return ok(c, { locale, tenantId: tenantId ?? null, messages });
  } catch (e) {
    console.error('i18n.messages failed', e);
    return err(c, 500, 'internal_error');
  }
});
