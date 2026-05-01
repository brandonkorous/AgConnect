import { createMiddleware } from 'hono/factory';
import { prisma, type Tx } from '@agconn/db';

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
 * Wraps every request in a Postgres transaction with `SET LOCAL app.role = 'service'`
 * and `SET LOCAL app.tenant_id = <PUBLIC_TENANT_ID>`. Hands a tx-pinned Prisma client
 * to handlers via `c.var.db`. RLS policies enforce tenant scoping; bypassing the
 * middleware reads/writes nothing.
 */
export const publicTenantMiddleware = createMiddleware<{ Variables: TenantVars }>(
  async (c, next) => {
    const tenantId = readPublicTenantId();

    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'service'`);
        await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`);
        c.set('db', tx);
        c.set('tenantId', tenantId);
        c.set('role', 'service');
        await next();
      },
      { timeout: 15_000, maxWait: 5_000 },
    );
  },
);

/**
 * Webhook role middleware — runs after Svix signature verification. Pins
 * `app.role = 'webhook'`, which RLS allows narrow cross-tenant access on
 * `email_log` and `email_suppression`. No tenant_id is set; the webhook
 * resolves tenant per-row from the looked-up email_log.
 */
export const webhookMiddleware = createMiddleware<{ Variables: TenantVars }>(
  async (c, next) => {
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'webhook'`);
        c.set('db', tx);
        c.set('tenantId', '');
        c.set('role', 'webhook');
        await next();
      },
      { timeout: 15_000, maxWait: 5_000 },
    );
  },
);
