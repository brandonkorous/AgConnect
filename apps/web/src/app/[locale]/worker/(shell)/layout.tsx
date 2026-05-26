import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { requireRole, UserRole } from '@/lib/auth/role';
import { WorkerSidebar, type WorkerNavCounts } from '@/components/worker/WorkerSidebar';
import { WorkerTopBar } from '@/components/worker/WorkerTopBar';
import { WorkerMobileShell } from '@/components/worker/WorkerMobileShell';
import { FieldModeSoftPrompt } from '@/components/field/FieldModeSoftPrompt';
import { fetchJobs } from '@/lib/api/jobs';
import { fetchApplications } from '@/lib/api/applications';
import { fetchMyMessageThreads } from '@/lib/api/me';
import { fetchSavedSearches } from '@/lib/api/saved-searches';

type Props = {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
};

async function fetchWorkerNavCounts(): Promise<WorkerNavCounts> {
    const [jobs, apps, threads, saved] = await Promise.all([
        fetchJobs({ limit: 1, cursor: null }).catch(
            () => ({ jobs: [] as unknown[], totalCount: undefined as number | undefined }),
        ),
        fetchApplications().catch(() => ({ applications: [] })),
        fetchMyMessageThreads().catch(() => ({ threads: [], totalUnread: 0 })),
        fetchSavedSearches().catch(() => []),
    ]);
    const browseJobs =
        (jobs as { totalCount?: number }).totalCount ??
        (jobs as { jobs?: unknown[] }).jobs?.length ??
        0;
    const myApplications = apps.applications.filter(
        (a) => a.status === 'applied' || a.status === 'reviewed',
    ).length;
    const messages = threads.totalUnread ?? 0;
    return {
        browse_jobs: browseJobs,
        my_applications: myApplications,
        messages,
        saved_searches: saved.length,
    };
}

export default async function WorkerLayout({ children, params }: Props) {
    const { locale } = await params;
    // Auth + onboarded gate. Un-onboarded workers go to the mobile-first
    // /field/onboarding flow (PR 1). PR 2 will UA-sniff here and offer a
    // desktop /worker/onboarding alternative. See docs/10-worker/99-field-mode.md
    // and docs/00-foundation/13-onboarding-identity-remediation/04-phase-2-worker-web.md.
    const { onboarded } = await requireRole(locale, UserRole.worker);
    if (!onboarded) {
        redirect(`/${locale}/field/onboarding` as Route);
    }
    const counts = await fetchWorkerNavCounts();
    return (
        <div className="flex min-h-screen items-start">
            <div className="print:hidden">
                <WorkerSidebar locale={locale} counts={counts} />
            </div>
            <main className="min-w-0 flex-1 flex flex-col min-h-screen">
                <div className="print:hidden">
                    <FieldModeSoftPrompt locale={locale} />
                    <WorkerMobileShell locale={locale} counts={counts} />
                    <WorkerTopBar />
                </div>
                {children}
            </main>
        </div>
    );
}
