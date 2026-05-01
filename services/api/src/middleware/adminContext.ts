import { createMiddleware } from 'hono/factory';
import { getAuth } from '@hono/clerk-auth';
import { err } from '@agconn/api-client/server';
import { prisma, type Tx } from '@agconn/db';

// Admin gate. Two acceptable paths:
//   1. Clerk session with publicMetadata.role === 'admin' (preferred)
//   2. Authorization: Bearer <ADMIN_BEARER_TOKEN> matching env (MVP fallback,
//      retained while Clerk admin onboarding is bootstrapped — remove once
//      every operator has a Clerk admin account).
//
// RLS bypass is enforced by SET LOCAL app.role = 'admin'.

export type AdminVars = {
  db: Tx;
  tenantId: string;
  role: 'admin';
  userId: string;
};

const readBearer = (header: string | undefined): string | null => {
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m && m[1] ? m[1] : null;
};

export const adminMiddleware = createMiddleware<{ Variables: AdminVars }>(
  async (c, next) => {
    let userId: string | null = null;

    const clerkAuth = getAuth(c);
    if (clerkAuth?.userId) {
      const user = await prisma.user.findUnique({ where: { id: clerkAuth.userId } });
      if (user && user.role === 'admin') {
        userId = user.id;
      }
    }

    if (!userId) {
      const expected = process.env.ADMIN_BEARER_TOKEN;
      const provided = readBearer(c.req.header('authorization'));
      if (expected && provided === expected) {
        userId = 'admin-bearer';
      }
    }

    if (!userId) {
      return err(c, 403, 'forbidden', 'Admin access required');
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
        await tx.$executeRawUnsafe(`SET LOCAL app.user_id = '${userId}'`);
        c.set('db', tx);
        c.set('tenantId', '00000000-0000-0000-0000-000000000000');
        c.set('role', 'admin');
        c.set('userId', userId);
        await next();
      },
      { timeout: 30_000, maxWait: 5_000 },
    );
  },
);
