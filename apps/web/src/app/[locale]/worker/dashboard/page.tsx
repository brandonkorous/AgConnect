import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { WorkerGreeting } from '@/components/worker/WorkerGreeting';
import { WorkerKpiRow } from '@/components/worker/WorkerKpiRow';
import { UpNextShift } from '@/components/worker/UpNextShift';
import { MatchedJobs } from '@/components/worker/MatchedJobs';
import { ApplicationsPanel } from '@/components/worker/ApplicationsPanel';
import { PaycheckCard } from '@/components/worker/PaycheckCard';
import { AvailabilityCard } from '@/components/worker/AvailabilityCard';
import { TrainingNudge } from '@/components/worker/TrainingNudge';
import { MessagesCard } from '@/components/worker/MessagesCard';
import { fetchProfile } from '@/lib/api/profile';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.dashboard.meta' });
  return { title: t('title') };
}

export default async function WorkerDashboardPage({ params }: Props) {
  const { locale } = await params;
  const profile = await fetchProfile();
  const workerName = profile.firstName || (locale === 'es' ? 'Amig@' : 'there');
  return (
    <div className="px-8 pb-16 pt-8">
      <WorkerGreeting name={workerName} />
      <WorkerKpiRow />
      <UpNextShift />
      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="grid gap-5">
          <MatchedJobs locale={locale} />
          <ApplicationsPanel locale={locale} />
        </div>
        <div className="grid gap-3.5">
          <PaycheckCard />
          <AvailabilityCard />
          <TrainingNudge />
          <MessagesCard />
        </div>
      </div>
    </div>
  );
}
