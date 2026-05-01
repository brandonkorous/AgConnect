import { createMiddleware } from 'hono/factory';
import { clerkMiddleware, getAuth } from '@hono/clerk-auth';
import { err } from '@agconn/api-client/server';
import { prisma, type Tx, type UserRole } from '@agconn/db';

// Per docs/00-foundation/02-auth/03-api.md the API resolves identity from
// Clerk and pins app.user_id + app.role + app.tenant_id on the connection
// before each handler. RLS then enforces tenant isolation.

export type AuthVars = {
  db: Tx;
  userId: string;
  userRole: UserRole;
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
