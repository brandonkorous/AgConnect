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
// Employer access is membership-based: employer_contacts rows with a user_id
// and accepted_at are this user's memberships. The active employer (one per
// request) is resolved from the X-Employer-Id header validated against the
// membership set, defaulting to the sole membership. Its role's permission
// bundle governs every employer route; app.employer_id pins RLS to it.
//
// RLS context (app.role / app.user_id / app.tenant_id / app.employer_id) is
// propagated via AsyncLocalStorage and applied per-query by the rlsClient
// proxy in @agconn/db.

export type EmployerMembership = {
    employerId: string;
    tenantId: string;
    legalName: string;
    roleKey: string;
    permissions: string[];
    scopeQualifier: string | null;
};

export type AuthVars = {
    db: Tx;
    userId: string;
    userRole: UserRole;
    permissions: string[];
    tenantId: string | null;
    role: 'authenticated';
    employerMemberships: EmployerMembership[];
    employerId: string | null;
    employerPermissions: string[];
    employerScope: string | null;
};

export const clerkAuthMiddleware = clerkMiddleware({
    publishableKey:
        process.env.CLERK_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
});

async function provisionFromClerk(c: Context, userId: string) {
    // The Clerk -> DB sync normally lands via the user.created webhook, but in
    // dev (no public webhook URL) and on a brand-new Clerk session the webhook
    // has not yet run. Hydrate a minimal User row from the Clerk session so the
    // request can proceed; the webhook (idempotent upsert) reconciles drift.
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

// Resolves the user's employer memberships from the roster. Uses the raw
// (non-RLS) client because this runs during the auth bootstrap, before the
// RLS context exists — same rationale as the user lookup above.
async function loadMemberships(userId: string): Promise<EmployerMembership[]> {
    const rows = await prisma.employerContact.findMany({
        where: { userId, acceptedAt: { not: null }, deletedAt: null },
        select: {
            role: { select: { key: true, permissions: true, scopeQualifier: true } },
            employer: { select: { id: true, tenantId: true, legalName: true, deletedAt: true } },
        },
        orderBy: { createdAt: 'asc' },
    });
    return rows
        .filter((r) => r.employer.deletedAt === null)
        .map((r) => ({
            employerId: r.employer.id,
            tenantId: r.employer.tenantId,
            legalName: r.employer.legalName,
            roleKey: r.role.key,
            permissions: r.role.permissions,
            scopeQualifier: r.role.scopeQualifier,
        }));
}

function resolveActiveEmployer(
    memberships: EmployerMembership[],
    requested: string | undefined,
): EmployerMembership | null {
    if (memberships.length === 0) return null;
    if (requested) {
        return memberships.find((m) => m.employerId === requested) ?? null;
    }
    return memberships.length === 1 ? memberships[0]! : null;
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

        const memberships = await loadMemberships(user.id);
        const requested = c.req.header('X-Employer-Id') ?? undefined;
        const active = resolveActiveEmployer(memberships, requested);
        if (requested && !active) {
            return err(c, 403, 'employer_forbidden', 'not a member of the requested employer');
        }

        // An employer member acts within the active employer's tenant; fall
        // back to the user's own tenant (workers / non-employer requests).
        const tenantId = active?.tenantId ?? user.tenantId;

        c.set('db', dbClients[poolName]);
        c.set('userId', user.id);
        c.set('userRole', user.role);
        c.set('permissions', user.permissions);
        c.set('tenantId', tenantId);
        c.set('role', 'authenticated');
        c.set('employerMemberships', memberships);
        c.set('employerId', active?.employerId ?? null);
        c.set('employerPermissions', active?.permissions ?? []);
        c.set('employerScope', active?.scopeQualifier ?? null);

        await runWithRlsContext(
            {
                role: 'authenticated',
                userId: user.id,
                tenantId: tenantId ?? undefined,
                employerId: active?.employerId ?? undefined,
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

// Gate for employer-domain routes: the request must be acting as a member of
// an employer. Replaces the old requireRole('employer') — a member's
// users.role may legitimately be 'worker' (a hired foreman), so access is
// driven by membership, not the coarse user role.
export const requireActiveEmployer = createMiddleware<{ Variables: AuthVars }>(
    async (c, next) => {
        if (c.var.employerMemberships.length === 0) {
            return err(c, 403, 'not_employer_member');
        }
        if (!c.var.employerId) {
            // Member of several employers but none selected for this request.
            return err(c, 409, 'employer_unselected', 'send X-Employer-Id to pick an employer');
        }
        await next();
    },
);

// Per-route permission gate over the active membership's role bundle.
export const requireEmployerPermission = (scope: Permission) =>
    createMiddleware<{ Variables: AuthVars }>(async (c, next) => {
        if (!hasPermission(c.var.employerPermissions, scope)) {
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
