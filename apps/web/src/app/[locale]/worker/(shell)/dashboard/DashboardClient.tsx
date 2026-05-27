'use client';

import { Suspense } from 'react';
import { WorkerGreeting } from '@/components/worker/WorkerGreeting';
import { WorkerKpiRow } from '@/components/worker/WorkerKpiRow';
import { UpNextShift } from '@/components/worker/UpNextShift';
import { MatchedJobs } from '@/components/worker/MatchedJobs';
import { ApplicationsPanel } from '@/components/worker/ApplicationsPanel';
import { PaycheckCard } from '@/components/worker/PaycheckCard';
import { AvailabilityCard } from '@/components/worker/AvailabilityCard';
import { TrainingNudge } from '@/components/worker/TrainingNudge';
import { MessagesCard } from '@/components/worker/MessagesCard';
import {
  SkeletonGreeting,
  SkeletonKpiRow,
  SkeletonUpNextShift,
  SkeletonMatchedJobs,
  SkeletonApplicationsPanel,
  SkeletonPaycheckCard,
  SkeletonAvailabilityCard,
  SkeletonTrainingNudge,
  SkeletonMessagesCard,
} from '@/components/ui/skeleton/domain';

// Client orchestrator. Each card is wrapped in its own Suspense boundary
// with a per-card skeleton; cards fill in independently as their queries
// resolve. No card gates another.

export function DashboardClient() {
  return (
    <div className="px-5 pb-16 pt-8">
      <Suspense fallback={<SkeletonGreeting />}>
        <WorkerGreeting />
      </Suspense>
      <Suspense fallback={<SkeletonKpiRow />}>
        <WorkerKpiRow />
      </Suspense>
      <Suspense fallback={<SkeletonUpNextShift />}>
        <UpNextShift />
      </Suspense>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="grid gap-5">
          <Suspense fallback={<SkeletonMatchedJobs />}>
            <MatchedJobs />
          </Suspense>
          <Suspense fallback={<SkeletonApplicationsPanel />}>
            <ApplicationsPanel />
          </Suspense>
        </div>
        <div className="grid gap-3.5">
          <Suspense fallback={<SkeletonPaycheckCard />}>
            <PaycheckCard />
          </Suspense>
          <Suspense fallback={<SkeletonAvailabilityCard />}>
            <AvailabilityCard />
          </Suspense>
          <Suspense fallback={<SkeletonTrainingNudge />}>
            <TrainingNudge />
          </Suspense>
          <Suspense fallback={<SkeletonMessagesCard />}>
            <MessagesCard />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
