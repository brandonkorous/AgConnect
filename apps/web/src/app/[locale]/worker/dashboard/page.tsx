import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { WorkerSidebar } from '@/components/worker/WorkerSidebar';
import { WorkerTopBar } from '@/components/worker/WorkerTopBar';
import { WorkerGreeting } from '@/components/worker/WorkerGreeting';
import { WorkerKpiRow } from '@/components/worker/WorkerKpiRow';
import { UpNextShift } from '@/components/worker/UpNextShift';
import { MatchedJobs } from '@/components/worker/MatchedJobs';
import { ApplicationsPanel } from '@/components/worker/ApplicationsPanel';
import { PaycheckCard } from '@/components/worker/PaycheckCard';
import { AvailabilityCard } from '@/components/worker/AvailabilityCard';
import { TrainingNudge } from '@/components/worker/TrainingNudge';
import { MessagesCard } from '@/components/worker/MessagesCard';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'worker.dashboard.meta' });
    return { title: t('title') };
}

export default async function WorkerDashboardPage({ params }: Props) {
    const { locale } = await params;
    const workerName = 'Miguel';

    return (
        <div className="bg-base-200 flex min-h-screen items-start">
            <WorkerSidebar active="dashboard" locale={locale} />
            <main className="min-w-0 flex-1">
                <WorkerTopBar />
                <div className="px-8 pb-16 pt-8">
                    <WorkerGreeting name={workerName} />
                    <WorkerKpiRow />
                    <UpNextShift />
                    <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
                        <div className="grid gap-5">
                            <MatchedJobs />
                            <ApplicationsPanel />
                        </div>
                        <div className="grid gap-3.5">
                            <PaycheckCard />
                            <AvailabilityCard />
                            <TrainingNudge />
                            <MessagesCard />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
