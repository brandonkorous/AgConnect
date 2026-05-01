import { createMiddleware } from 'hono/factory';
import { clerkMiddleware, getAuth } from '@hono/clerk-auth';
import { err } from '@agconn/api-client/server';
import { prisma, type Tx, type UserRole } from '@agconn/db';
import { hasPermission, type Permission } from '@agconn/schemas';

// Per docs/00-foundation/02-auth/* the API authenticates via Clerk, then
// reads role + permissions from the local users row. RLS uses app.role
// ('authenticated' | 'admin' | 'service' | 'webhook') for coarse cuts;
// permission scopes are enforced at the application layer.

export type AuthVars = {
  db: Tx;
  userId: string;
  userRole: UserRole;
  permissions: string[];
  tenantId: string | null;
  role: 'authenticated';
};

export const clerkAuthMiddleware = clerkMiddleware();

export const requireAuth = createMiddleware<{ Variables: AuthVars }>(async (c, next) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return err(c, 401, 'unauthenticated');
  }

  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!user) {
    // Clerk user exists but webhook hasn't synced yet (or they were deleted
    // server-side). Either way, refuse.
    return err(c, 403, 'no_tenant');
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.role = 'authenticated'`);
      await tx.$executeRawUnsafe(`SET LOCAL app.user_id = '${user.id}'`);
      if (user.tenantId) {
        await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${user.tenantId}'`);
      }
      c.set('db', tx);
      c.set('userId', user.id);
      c.set('userRole', user.role);
      c.set('permissions', user.permissions);
      c.set('tenantId', user.tenantId);
      c.set('role', 'authenticated');
      await next();
    },
    { timeout: 30_000, maxWait: 5_000 },
  );
});

export const requireRole =
  (...allowed: UserRole[]) =>
  createMiddleware<{ Variables: AuthVars }>(async (c, next) => {
    const role = c.var.userRole;
    if (!role || !allowed.includes(role)) {
      return err(c, 403, 'forbidden');
    }
    await next();
  });

export const requirePermission = (scope: Permission) =>
  createMiddleware<{ Variables: AuthVars }>(async (c, next) => {
    if (!hasPermission(c.var.permissions, scope)) {
      return err(c, 403, 'permission_denied');
    }
    await next();
  });

export const requireAdmin = createMiddleware<{ Variables: AuthVars }>(async (c, next) => {
  if (c.var.userRole !== 'admin') {
    return err(c, 403, 'not_admin');
  }
  // Elevate the connection role so admin RLS policies apply. Without this,
  // admin endpoints can't read across tenants even when the user is an admin.
  await c.var.db.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
  await next();
});

export const requireTenant = createMiddleware<{ Variables: AuthVars }>(async (c, next) => {
  if (!c.var.tenantId) {
    return err(c, 403, 'no_tenant');
  }
  await next();
});
