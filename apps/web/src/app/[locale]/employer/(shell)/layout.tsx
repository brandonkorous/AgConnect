import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { resolveRole, homePathForRole, UserRole } from '@/lib/auth/role';
import { EmployerSidebar } from '@/components/employer/EmployerSidebar';
import { EmployerTopBar } from '@/components/employer/EmployerTopBar';
import { EmployerMobileShell } from '@/components/employer/EmployerMobileShell';
import { VerificationBanner } from '@/components/employer/VerificationBanner';
import { getMyMemberships } from '@/lib/api/members';
import {
    getEmployerProfile,
    listEmployerJobs,
    listInbox,
    verificationStatus,
} from '@/lib/api/employer';

type Props = {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
};

export default async function EmployerShellLayout({ children, params }: Props) {
    const { locale } = await params;

    // Access is membership-driven, not role-driven: a foreman's users.role
    // is 'worker' but an accepted employer membership still grants the
    // (scoped) employer shell. Only block when the caller is neither an
    // employer nor a member of any employer.
    const resolved = await resolveRole();
    if (!resolved) redirect(`/${locale}/sign-in` as Route);

    const { activeEmployerId, memberships } = await getMyMemberships();
    if (memberships.length === 0 && resolved.role !== UserRole.employer) {
        redirect(homePathForRole(locale, resolved.role) as Route);
    }

    const [profile, jobs, inbox] = await Promise.all([
        getEmployerProfile(),
        listEmployerJobs(),
        listInbox(),
    ]);

    if (!profile) {
        redirect(`/${locale}/employer/onboarding`);
    }

    const active =
        memberships.find((m) => m.employerId === activeEmployerId) ?? memberships[0] ?? null;
    const employers = memberships.map((m) => ({
        employerId: m.employerId,
        legalName: m.legalName,
    }));

    const status = verificationStatus(profile);
    const initials = profile.displayName
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const inboxNew = inbox.filter((a) => a.status === 'applied').length;
    const jobsActive = jobs.filter((j) => j.status === 'active').length;

    return (
        <div className="flex min-h-screen items-start print:block print:min-h-0">
            <EmployerSidebar
                locale={locale}
                displayName={profile.displayName}
                initials={initials}
                candidatesCount={inboxNew}
                jobsCount={jobsActive}
                permissions={active?.permissions ?? []}
                scope={active?.scopeQualifier ?? null}
                employers={employers}
                activeEmployerId={active?.employerId ?? null}
            />
            <main className="min-w-0 flex-1 flex flex-col min-h-screen">
                <div className="print:hidden">
                    <EmployerMobileShell
                        locale={locale}
                        displayName={profile.displayName}
                        initials={initials}
                        candidatesCount={inboxNew}
                        jobsCount={jobsActive}
                        permissions={active?.permissions ?? []}
                        scope={active?.scopeQualifier ?? null}
                        employers={employers}
                        activeEmployerId={active?.employerId ?? null}
                    />
                    <EmployerTopBar locale={locale} />
                    <VerificationBanner
                        status={status}
                        rejectionReason={profile.rejectionReason}
                        locale={locale}
                    />
                </div>
                {children}
            </main>
        </div>
    );
}
