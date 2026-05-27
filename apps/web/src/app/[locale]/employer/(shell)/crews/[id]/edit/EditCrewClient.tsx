'use client';

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  useCrewSuspense,
  useCrewInsightsSuspense,
  useActiveHiresSuspense,
} from '@/lib/api/hooks/employer-ops';
import { CrewEditorPage } from '@/components/employer/crews/edit-crew/CrewEditorPage';
import { SkeletonCard } from '@/components/ui/skeleton';

function EditCrewInner({ id }: { id: string }) {
  const locale = useLocale();
  const { data: detail } = useCrewSuspense(id);
  const { data: insights } = useCrewInsightsSuspense(id);
  const { data: hires } = useActiveHiresSuspense();
  if (!detail) notFound();
  return (
    <CrewEditorPage
      locale={locale}
      mode="edit"
      crew={detail.crew}
      members={detail.members}
      insights={insights}
      hires={hires}
    />
  );
}

export function EditCrewClient({ id }: { id: string }) {
  return (
    <Suspense fallback={<SkeletonCard rows={6} />}>
      <EditCrewInner id={id} />
    </Suspense>
  );
}
