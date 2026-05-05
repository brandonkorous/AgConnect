import { createMiddleware } from 'hono/factory';
import { dbClients, runWithRlsContext, type PoolName, type Tx } from '@agconn/db';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type TenantVars = {
  db: Tx;
  tenantId: string;
  role: 'service' | 'webhook' | 'admin';
};

function readPublicTenantId(): string {
  const id = process.env.PUBLIC_TENANT_ID;
  if (!id || !UUID_RE.test(id)) {
    throw new Error(
      `PUBLIC_TENANT_ID is missing or malformed; expected UUID, got ${JSON.stringify(id)}`,
    );
  }
  return id;
}

/**
 * Stamps the request with `app.role = 'service'` and `app.tenant_id = <PUBLIC_TENANT_ID>`
 * via AsyncLocalStorage. The rlsClient handed to handlers as `c.var.db` opens a short
 * Postgres transaction around each query and applies the context inside it, so a
 * pooled connection is held only for the duration of one statement (not the request).
 * RLS policies enforce tenant scoping; bypassing the middleware reads/writes nothing.
 */
export const publicTenantMiddleware = (poolName: PoolName) =>
  createMiddleware<{ Variables: TenantVars }>(async (c, next) => {
    const tenantId = readPublicTenantId();

    c.set('db', dbClients[poolName]);
    c.set('tenantId', tenantId);
    c.set('role', 'service');

    await runWithRlsContext({ role: 'service', tenantId }, () => next());
  });

/**
 * Webhook role middleware — runs after Svix signature verification. Stamps
 * `app.role = 'webhook'`, which RLS allows narrow cross-tenant access on
 * `email_log` and `email_suppression`. No tenant_id is set; the webhook
 * resolves tenant per-row from the looked-up email_log.
 */
export const webhookMiddleware = (poolName: PoolName) =>
  createMiddleware<{ Variables: TenantVars }>(async (c, next) => {
    c.set('db', dbClients[poolName]);
    c.set('tenantId', '');
    c.set('role', 'webhook');

    await runWithRlsContext({ role: 'webhook' }, () => next());
  });
