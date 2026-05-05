import { redirect } from 'next/navigation';
import { EmployerSidebar } from '@/components/employer/EmployerSidebar';
import { EmployerTopBar } from '@/components/employer/EmployerTopBar';
import { EmployerMobileShell } from '@/components/employer/EmployerMobileShell';
import { VerificationBanner } from '@/components/employer/VerificationBanner';
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
    const [profile, jobs, inbox] = await Promise.all([
        getEmployerProfile(),
        listEmployerJobs(),
        listInbox(),
    ]);

    if (!profile) {
        redirect(`/${locale}/employer/onboarding`);
    }

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
            />
            <main className="min-w-0 flex-1">
                <div className="print:hidden">
                    <EmployerMobileShell
                        locale={locale}
                        displayName={profile.displayName}
                        initials={initials}
                        candidatesCount={inboxNew}
                        jobsCount={jobsActive}
                    />
                    <EmployerTopBar locale={locale} canPublish={status === 'verified'} />
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
