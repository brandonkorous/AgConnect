import { dbClients, runWithRlsContext, Lang, UserRole, type User } from '@agconn/db';

// The auth bootstrap runs before a tenant is known, as app.role = 'system' scoped to the Clerk user
// (users_system_self, employer_contacts_system_self, employer_profiles_system_member, roles_system_read).
const asUser = <T>(userId: string, fn: () => Promise<T>) =>
    runWithRlsContext({ role: 'system', userId }, fn);

export type EmployerMembership = {
    employerId: string;
    tenantId: string;
    legalName: string;
    roleKey: string;
    permissions: string[];
    scopeQualifier: string | null;
};

export type ClerkIdentity = {
    email: string | null;
    phone: string | null;
    role?: string;
    locale?: string;
};

export function findAuthUser(userId: string): Promise<User | null> {
    return asUser(userId, () => dbClients.shared.user.findUnique({ where: { id: userId } }));
}

// Mirrors the user.created webhook (idempotent upsert) for a session that arrives before it.
export function upsertClerkUser(userId: string, who: ClerkIdentity): Promise<User> {
    const role: UserRole =
        who.role === 'employer' || who.role === 'training_org' || who.role === 'admin'
            ? (who.role as UserRole)
            : UserRole.worker;
    const preferredLang = who.locale === 'en' ? Lang.en : Lang.es;
    const email = who.email?.toLowerCase() ?? null;
    return asUser(userId, () =>
        dbClients.shared.user.upsert({
            where: { id: userId },
            update: { email, phone: who.phone },
            create: { id: userId, role, preferredLang, email, phone: who.phone, tenantId: null },
        }),
    );
}

// The user's accepted, live employer memberships, oldest first.
export async function loadMemberships(userId: string): Promise<EmployerMembership[]> {
    const rows = await asUser(userId, () =>
        dbClients.shared.employerContact.findMany({
            where: { userId, acceptedAt: { not: null }, deletedAt: null },
            select: {
                role: { select: { key: true, permissions: true, scopeQualifier: true } },
                employer: { select: { id: true, tenantId: true, legalName: true, deletedAt: true } },
            },
            orderBy: { createdAt: 'asc' },
        }),
    );
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
