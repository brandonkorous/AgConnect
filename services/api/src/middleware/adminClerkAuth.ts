import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { clerkMiddleware, getAuth } from '@clerk/hono';
import { err } from '@agconn/api-client/server';
import { dbClients, runWithRlsContext, type PoolName, type Tx } from '@agconn/db';

// Admin Clerk is a separate instance from the worker/employer Clerk used by
// /v1/*. Routes mounted under /admin/v1/* validate sessions against this
// instance only — there is no cross-instance trust.
//
// The session's org_role drives the role gate. Membership in any org of the
// admin Clerk instance is implicit (the instance has one org); the org_role
// claim distinguishes admin from super_admin.

const ADMIN_ROLES = new Set(['org:admin', 'org:super_admin']);

export type AdminOrgVars = {
  db: Tx;
  userId: string;
  orgId: string;
  orgRole: 'org:admin' | 'org:super_admin';
  // The tenant the admin is impersonating, or null for platform-scope.
  // Header X-Admin-Tenant-Id from the admin app, sourced from /t/<id>/... URL.
  tenantId: string | null;
  role: 'admin';
};

export const clerkAdminAuthMiddleware = clerkMiddleware({
  publishableKey: process.env.NEXT_PUBLIC_ADMIN_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.ADMIN_CLERK_SECRET_KEY,
});

const readTenantHeader = (c: Context): string | null => {
  const raw = c.req.header('x-admin-tenant-id');
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Loose uuid sanity check; full validation happens at the data layer.
  if (!/^[0-9a-f-]{32,36}$/i.test(trimmed)) return null;
  return trimmed.toLowerCase();
};

const readBearer = (header: string | undefined): string | null => {
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m && m[1] ? m[1] : null;
};

export const requireAdminOrg = (poolName: PoolName) =>
  createMiddleware<{ Variables: AdminOrgVars }>(async (c, next) => {
    const tenantId = readTenantHeader(c);

    // Bearer fallback: lets local dev, CI smoke tests, and scripts hit
    // /admin/v1/* without a live admin Clerk session. The token is shared
    // with the legacy adminMiddleware via ADMIN_BEARER_TOKEN; presence of
    // the env var is what enables the path.
    const expectedBearer = process.env.ADMIN_BEARER_TOKEN;
    const providedBearer = readBearer(c.req.header('authorization'));
    if (expectedBearer && providedBearer === expectedBearer) {
      c.set('db', dbClients[poolName]);
      c.set('userId', 'admin-bearer');
      c.set('orgId', 'admin-bearer-org');
      c.set('orgRole', 'org:super_admin');
      c.set('tenantId', tenantId);
      c.set('role', 'admin');

      await runWithRlsContext(
        {
          role: 'admin',
          userId: 'admin-bearer',
          tenantId: tenantId ?? undefined,
        },
        () => next(),
      );
      return;
    }

    const auth = getAuth(c);
    if (!auth?.userId) {
      return err(c, 401, 'unauthenticated');
    }
    if (!auth.orgId || !auth.orgRole || !ADMIN_ROLES.has(auth.orgRole)) {
      return err(c, 403, 'forbidden', 'Admin org membership required');
    }

    c.set('db', dbClients[poolName]);
    c.set('userId', auth.userId);
    c.set('orgId', auth.orgId);
    c.set('orgRole', auth.orgRole as AdminOrgVars['orgRole']);
    c.set('tenantId', tenantId);
    c.set('role', 'admin');

    await runWithRlsContext(
      {
        role: 'admin',
        userId: auth.userId,
        tenantId: tenantId ?? undefined,
      },
      () => next(),
    );
  });
