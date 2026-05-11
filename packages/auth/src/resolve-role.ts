import { cache } from 'react';
import { auth } from '@clerk/nextjs/server';
import { prisma, UserRole } from '@agconn/db';

export type ResolvedRole = {
    userId: string;
    role: UserRole;
};

// Per-request memoized: sibling RSC fetches sharing the same render tree
// will reuse a single auth() + DB lookup instead of issuing N of them.
export const resolveRole = cache(async (): Promise<ResolvedRole | null> => {
    const { userId } = await auth();
    if (!userId) return null;
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    if (!user) return null;
    return { userId, role: user.role };
});

// Where each role's home lives within the locale tree. Unknown roles fall
// back to the marketing root.
export function homePathForRole(locale: string, role: UserRole): string {
    switch (role) {
        case UserRole.worker:
            return `/${locale}/worker`;
        case UserRole.employer:
            return `/${locale}/employer`;
        case UserRole.admin:
        case UserRole.training_org:
        default:
            return `/${locale}`;
    }
}
