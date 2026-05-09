import { createMiddleware } from 'hono/factory';
import { dbClients, runWithRlsContext, type PoolName, type Tx } from '@agconn/db';

export type TenantVars = {
  db: Tx;
  tenantId: string;
  role: 'service' | 'webhook' | 'admin';
};

export type AnonymousVars = {
  db: Tx;
  role: 'anonymous';
};

export type ServiceNoTenantVars = {
  db: Tx;
  role: 'service';
};

/**
 * Anonymous-role middleware for the public landing surface. No tenant is
 * pinned — RLS marketplace policies on `job_postings` and `training_programs`
 * grant SELECT to `app.role = 'anonymous'`, and the waitlist insert policy
 * grants INSERT (when `tenant_id IS NULL`). No other tables are reachable.
 */
export const anonymousMiddleware = (poolName: PoolName) =>
  createMiddleware<{ Variables: AnonymousVars }>(async (c, next) => {
    c.set('db', dbClients[poolName]);
    c.set('role', 'anonymous');
    await runWithRlsContext({ role: 'anonymous' }, () => next());
  });

/**
 * Service role without a pinned tenant. Used by waitlist confirm /
 * unsubscribe handlers that act on NULL-tenant waitlist rows looked up by
 * an HMAC-signed token. RLS policies on `waitlist` and `email_log` permit
 * the service role to touch NULL-tenant rows; tenant-scoped rows are
 * unreachable because `app.tenant_id` is empty (NULLIF coerces it to NULL).
 */
export const serviceNoTenantMiddleware = (poolName: PoolName) =>
  createMiddleware<{ Variables: ServiceNoTenantVars }>(async (c, next) => {
    c.set('db', dbClients[poolName]);
    c.set('role', 'service');
    await runWithRlsContext({ role: 'service' }, () => next());
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
