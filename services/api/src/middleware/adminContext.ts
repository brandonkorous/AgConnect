import { createMiddleware } from 'hono/factory';
import { getAuth } from '@clerk/hono';
import { err } from '@agconn/api-client/server';
import { dbClients, runWithRlsContext, type PoolName, type Tx } from '@agconn/db';
import { findAuthUser } from './auth-bootstrap.js';

// Admin gate: a Clerk user whose users row is admin, or the ADMIN_BEARER_TOKEN; the request then runs as app.role = 'admin'.

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

export const adminMiddleware = (poolName: PoolName) =>
  createMiddleware<{ Variables: AdminVars }>(async (c, next) => {
    let userId: string | null = null;

    const clerkAuth = getAuth(c);
    if (clerkAuth?.userId) {
      const user = await findAuthUser(clerkAuth.userId);
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

    c.set('db', dbClients[poolName]);
    c.set('tenantId', '00000000-0000-0000-0000-000000000000');
    c.set('role', 'admin');
    c.set('userId', userId);

    await runWithRlsContext({ role: 'admin', userId }, () => next());
  });
