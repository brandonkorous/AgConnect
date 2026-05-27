'use client';

import { Suspense, type ReactNode } from 'react';
import { WorkerGreeting } from '@/components/worker/WorkerGreeting';
import { WorkerKpiRow } from '@/components/worker/WorkerKpiRow';
import { UpNextShift } from '@/components/worker/UpNextShift';
import { MatchedJobs } from '@/components/worker/MatchedJobs';
import { ApplicationsPanel } from '@/components/worker/ApplicationsPanel';
import { PaycheckCard } from '@/components/worker/PaycheckCard';
import { AvailabilityCard } from '@/components/worker/AvailabilityCard';
import { TrainingNudge } from '@/components/worker/TrainingNudge';
import { MessagesCard } from '@/components/worker/MessagesCard';
import { CardErrorBoundary } from '@/components/ui/CardErrorBoundary';
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

// One card failing should not blank the dashboard. Each card is wrapped in
// a CardErrorBoundary that swallows the throw and renders nothing, plus a
// Suspense with a per-card skeleton.
function Card({ skeleton, children }: { skeleton: ReactNode; children: ReactNode }) {
  return (
    <CardErrorBoundary fallback={null}>
      <Suspense fallback={skeleton}>{children}</Suspense>
    </CardErrorBoundary>
  );
}

export function DashboardClient() {
  return (
    <div className="px-5 pb-16 pt-8">
      <Card skeleton={<SkeletonGreeting />}>
        <WorkerGreeting />
      </Card>
      <Card skeleton={<SkeletonKpiRow />}>
        <WorkerKpiRow />
      </Card>
      <Card skeleton={<SkeletonUpNextShift />}>
        <UpNextShift />
      </Card>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="grid gap-5">
          <Card skeleton={<SkeletonMatchedJobs />}>
            <MatchedJobs />
          </Card>
          <Card skeleton={<SkeletonApplicationsPanel />}>
            <ApplicationsPanel />
          </Card>
        </div>
        <div className="grid gap-3.5">
          <Card skeleton={<SkeletonPaycheckCard />}>
            <PaycheckCard />
          </Card>
          <Card skeleton={<SkeletonAvailabilityCard />}>
            <AvailabilityCard />
          </Card>
          <Card skeleton={<SkeletonTrainingNudge />}>
            <TrainingNudge />
          </Card>
          <Card skeleton={<SkeletonMessagesCard />}>
            <MessagesCard />
          </Card>
        </div>
      </div>
    </div>
  );
}
