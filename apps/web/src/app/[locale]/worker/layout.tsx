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
    const counts = await fetchWorkerNavCounts();
    return (
        <div className="flex min-h-screen items-start">
            <div className="print:hidden">
                <WorkerSidebar locale={locale} counts={counts} />
            </div>
            <main className="min-w-0 flex-1">
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
