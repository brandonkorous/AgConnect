import 'server-only';
import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { UserRole } from '@agconn/auth';
import { fetchMe } from '@/lib/api/me';

export { UserRole };

export type ResolvedRole = {
    userId: string;
    role: UserRole;
    onboarded: boolean;
};

export type RequireRoleOptions = {
    signInPath?: (locale: string) => string;
    onboardingPath?: (locale: string) => string;
    mismatchPath?: (locale: string, actual: UserRole) => string;
};

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

export async function resolveRole(): Promise<ResolvedRole | null> {
    const res = await fetchMe();
    if (!res.ok) return null;
    return {
        userId: res.data.user.id,
        role: res.data.user.role,
        onboarded: res.data.user.onboarded,
    };
}

export async function requireRole(
    locale: string,
    expected: UserRole,
    options: RequireRoleOptions = {},
): Promise<ResolvedRole> {
    const signInPath = options.signInPath ?? ((l) => `/${l}/sign-in`);
    const onboardingPath =
        options.onboardingPath ?? ((l) => `/${l}/worker/onboarding`);
    const mismatchPath = options.mismatchPath ?? homePathForRole;

    const res = await fetchMe();
    if (!res.ok) {
        if (res.code === 'unauthenticated') redirect(signInPath(locale) as Route);
        if (res.code === 'no_tenant') redirect(onboardingPath(locale) as Route);
        redirect(signInPath(locale) as Route);
    }

    const { user } = res.data;
    if (user.role !== expected) redirect(mismatchPath(locale, user.role) as Route);
    return { userId: user.id, role: user.role, onboarded: user.onboarded };
}
