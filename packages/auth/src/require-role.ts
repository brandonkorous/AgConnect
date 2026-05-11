import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma, UserRole } from '@agconn/db';
import { homePathForRole, type ResolvedRole } from './resolve-role.js';

export type RequireRoleOptions = {
    signInPath?: (locale: string) => string;
    onboardingPath?: (locale: string) => string;
    mismatchPath?: (locale: string, actual: UserRole) => string;
};

// Server-side gate for a section layout. Resolves the current user's role
// and redirects when they don't match the expected role. Always returns the
// resolved role on success so the caller can use the userId without a
// second lookup.
export async function requireRole(
    locale: string,
    expected: UserRole,
    options: RequireRoleOptions = {},
): Promise<ResolvedRole> {
    const signInPath = options.signInPath ?? ((l) => `/${l}/sign-in`);
    const onboardingPath = options.onboardingPath ?? ((l) => `/${l}/onboarding`);
    const mismatchPath = options.mismatchPath ?? homePathForRole;

    const { userId } = await auth();
    if (!userId) redirect(signInPath(locale));

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    if (!user) redirect(onboardingPath(locale));

    if (user.role !== expected) redirect(mismatchPath(locale, user.role));
    return { userId, role: user.role };
}
