import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { currentUser } from '@clerk/nextjs/server';
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
import { fetchMyShifts } from '@/lib/api/me';
import { fetchRecommendedJobs } from '@/lib/api/jobs';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.dashboard.meta' });
  return { title: t('title') };
}

export default async function WorkerDashboardPage({ params }: Props) {
  const { locale } = await params;
  const [profile, clerkUser, shifts, matched] = await Promise.all([
    fetchProfile(),
    currentUser(),
    fetchMyShifts(),
    fetchRecommendedJobs(),
  ]);
  const workerName =
    profile.firstName ||
    clerkUser?.firstName ||
    (locale === 'es' ? 'Amig@' : 'there');
  const now = Date.now();
  const upcomingShifts = shifts.filter(
    (s) => new Date(s.shift.startTime).getTime() >= now,
  ).length;
  const newMatches = matched.length;
  return (
    <div className="px-8 pb-16 pt-8">
      <WorkerGreeting
        name={workerName}
        upcomingShifts={upcomingShifts}
        newMatches={newMatches}
      />
      <WorkerKpiRow locale={locale} />
      <UpNextShift locale={locale} />
      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="grid gap-5">
          <MatchedJobs locale={locale} />
          <ApplicationsPanel locale={locale} />
        </div>
        <div className="grid gap-3.5">
          <PaycheckCard locale={locale} />
          <AvailabilityCard locale={locale} />
          <TrainingNudge locale={locale} />
          <MessagesCard locale={locale} />
        </div>
      </div>
    </div>
  );
}
