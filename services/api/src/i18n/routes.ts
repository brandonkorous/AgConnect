// Public i18n endpoint — serves the assembled translation tree for a locale.
//
// Apps (web, admin) hit GET /v1/i18n/messages?locale=en at SSR time to
// render localized chrome. The tree is cached in-process per (locale, tenant)
// and carries an ETag, so a revalidating caller gets a 304 with no body.
//
// Tenant-scoped overrides: when a tenant ID is supplied, tenant rows merge on
// top of globals (deep merge by namespace.key). Without a tenant ID, only
// global rows are returned.
//
// Reads run as the `service` role, whose translation_keys policy is
// SELECT-only on published rows. The endpoint itself is public by design.

import { Hono } from 'hono';
import { z } from 'zod';
import { ok, err, validate } from '@agconn/api-client/server';
import { getMessagesEntry } from './messages-store.js';

export const i18nRoutes = new Hono();

const messagesQuerySchema = z.object({
  locale: z.enum(['en', 'es']),
  tenantId: z.string().uuid().optional(),
});

i18nRoutes.get('/messages', validate('query', messagesQuerySchema), async (c) => {
  const { locale, tenantId } = c.var.body;

  try {
    const { messages, etag } = await getMessagesEntry(locale, tenantId ?? null);
    c.header('Cache-Control', 'public, max-age=300, s-maxage=300');
    c.header('ETag', etag);
    if (c.req.header('if-none-match') === etag) return c.body(null, 304);
    return ok(c, { locale, tenantId: tenantId ?? null, messages });
  } catch (e) {
    console.error('i18n.messages failed', e);
    return err(c, 500, 'internal_error');
  }
});
