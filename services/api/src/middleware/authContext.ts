import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { clerkMiddleware, getAuth } from '@clerk/hono';
import { err } from '@agconn/api-client/server';
import {
    Lang,
    prisma,
    dbClients,
    runWithRlsContext,
    getRlsContext,
    UserRole,
    type PoolName,
    type Tx,
} from '@agconn/db';
import { hasPermission, type Permission } from '@agconn/schemas';

// Per docs/00-foundation/02-auth/* the API authenticates via Clerk, then
// reads role + permissions from the local users row. RLS uses app.role
// ('authenticated' | 'admin' | 'service' | 'webhook') for coarse cuts;
// permission scopes are enforced at the application layer.
//
// RLS context (app.role / app.user_id / app.tenant_id) is propagated via
// AsyncLocalStorage and applied on a per-query basis by the rlsClient proxy
// in @agconn/db. Earlier versions of this middleware held a single Prisma
// transaction open for the entire request lifetime to keep SET LOCAL alive,
// which pinned a pooled connection per request and exhausted the pool under
// any concurrency.

export type AuthVars = {
    db: Tx;
    userId: string;
    userRole: UserRole;
    permissions: string[];
    tenantId: string | null;
    role: 'authenticated';
};

// @clerk/hono defaults to reading CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY
// from env, but our project standardizes on NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
// (so the same value can be reused by apps/web). Pass the keys in explicitly so
// the middleware works regardless of which name is set.
export const clerkAuthMiddleware = clerkMiddleware({
    publishableKey:
        process.env.CLERK_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
});

async function provisionFromClerk(c: Context, userId: string) {
    // The Clerk → DB sync normally lands via the user.created webhook, but in
    // dev (no public webhook URL) and on a brand-new Clerk session, the webhook
    // has not yet run. Hydrate a minimal User row from the Clerk session itself
    // so the request can proceed; the webhook (idempotent upsert) will reconcile
    // any drift later.
    try {
        const cu = await c.get('clerk').users.getUser(userId);
        const email =
            cu.emailAddresses.find((e) => e.id === cu.primaryEmailAddressId)?.emailAddress ??
            cu.emailAddresses[0]?.emailAddress ??
            null;
        const phone =
            cu.phoneNumbers.find((p) => p.id === cu.primaryPhoneNumberId)?.phoneNumber ??
            cu.phoneNumbers[0]?.phoneNumber ??
            null;
        const meta = (cu.unsafeMetadata ?? {}) as { role?: string; locale?: string };
        const role: UserRole =
            meta.role === 'employer' || meta.role === 'training_org' || meta.role === 'admin'
                ? (meta.role as UserRole)
                : UserRole.worker;
        const preferredLang = meta.locale === 'en' ? Lang.en : Lang.es;
        return prisma.user.upsert({
            where: { id: userId },
            update: { email: email?.toLowerCase() ?? null, phone },
            create: {
                id: userId,
                role,
                preferredLang,
                email: email?.toLowerCase() ?? null,
                phone,
                tenantId: null,
            },
        });
    } catch {
        return null;
    }
}

// Factory: each domain's route file calls `requireAuth('worker')`,
// `requireAuth('employer')`, etc. so handlers receive a domain-scoped Prisma
// client via c.var.db. Pool isolation prevents one domain from starving others.
export const requireAuth = (poolName: PoolName) =>
    createMiddleware<{ Variables: AuthVars }>(async (c, next) => {
        const auth = getAuth(c);
        if (!auth?.userId) {
            return err(c, 401, 'unauthenticated');
        }

        let user = await prisma.user.findUnique({ where: { id: auth.userId } });
        if (!user) {
            user = await provisionFromClerk(c, auth.userId);
            if (!user) {
                return err(c, 403, 'no_tenant');
            }
        }

        c.set('db', dbClients[poolName]);
        c.set('userId', user.id);
        c.set('userRole', user.role);
        c.set('permissions', user.permissions);
        c.set('tenantId', user.tenantId);
        c.set('role', 'authenticated');

        await runWithRlsContext(
            {
                role: 'authenticated',
                userId: user.id,
                tenantId: user.tenantId ?? undefined,
            },
            () => next(),
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
    // Elevate the RLS role so admin policies apply. Without this, admin
    // endpoints can't read across tenants even when the user is an admin.
    const ctx = getRlsContext();
    if (!ctx) {
        return err(c, 500, 'rls_context_missing', 'requireAdmin must run after requireAuth');
    }
    await runWithRlsContext({ ...ctx, role: 'admin' }, () => next());
});

export const requireTenant = createMiddleware<{ Variables: AuthVars }>(async (c, next) => {
    if (!c.var.tenantId) {
        return err(c, 403, 'no_tenant');
    }
    await next();
});
