import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { clerkMiddleware, getAuth } from '@clerk/hono';
import { err } from '@agconn/api-client/server';
import {
    dbClients,
    runWithRlsContext,
    getRlsContext,
    UserRole,
    type PoolName,
    type Tx,
    type User,
} from '@agconn/db';
import { hasPermission, type Permission } from '@agconn/schemas';
import {
    findAuthUser,
    loadMemberships,
    upsertClerkUser,
    type EmployerMembership,
} from './auth-bootstrap.js';

// Clerk authenticates; the users row and accepted employer_contacts memberships decide role and permissions.
// The active employer comes from X-Employer-Id (or the sole membership) and pins app.employer_id for RLS.

export type { EmployerMembership };

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

// The user.created webhook normally creates the row; a brand-new session can arrive first.
async function provisionFromClerk(c: Context, userId: string): Promise<User | null> {
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
        return await upsertClerkUser(userId, { email, phone, role: meta.role, locale: meta.locale });
    } catch {
        return null;
    }
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

type AuthContext = Context<{ Variables: AuthVars }>;

function setAuthVars(c: AuthContext, poolName: PoolName, user: User, memberships: EmployerMembership[], active: EmployerMembership | null) {
    c.set('db', dbClients[poolName]);
    c.set('userId', user.id);
    c.set('userRole', user.role);
    c.set('permissions', user.permissions);
    c.set('tenantId', active?.tenantId ?? user.tenantId);
    c.set('role', 'authenticated');
    c.set('employerMemberships', memberships);
    c.set('employerId', active?.employerId ?? null);
    c.set('employerPermissions', active?.permissions ?? []);
    c.set('employerScope', active?.scopeQualifier ?? null);
}

// requireAuth('worker'), requireAuth('employer'), ... hands each domain its own pool via c.var.db.
export const requireAuth = (poolName: PoolName) =>
    createMiddleware<{ Variables: AuthVars }>(async (c, next) => {
        const auth = getAuth(c);
        if (!auth?.userId) {
            return err(c, 401, 'unauthenticated');
        }
        const user = (await findAuthUser(auth.userId)) ?? (await provisionFromClerk(c, auth.userId));
        if (!user) {
            return err(c, 403, 'no_tenant');
        }
        const memberships = await loadMemberships(user.id);
        const requested = c.req.header('X-Employer-Id') ?? undefined;
        const active = resolveActiveEmployer(memberships, requested);
        if (requested && !active) {
            return err(c, 403, 'employer_forbidden', 'not a member of the requested employer');
        }
        setAuthVars(c, poolName, user, memberships, active);
        // An employer member acts in the active employer's tenant; anyone else in their own.
        const tenantId = c.var.tenantId ?? undefined;
        const employerId = active?.employerId ?? undefined;
        await runWithRlsContext({ role: 'authenticated', userId: user.id, tenantId, employerId }, () => next());
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
