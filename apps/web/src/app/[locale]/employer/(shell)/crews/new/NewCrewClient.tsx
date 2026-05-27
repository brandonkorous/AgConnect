'use client';

import { Suspense } from 'react';
import { useLocale } from 'next-intl';
import { useActiveHiresSuspense } from '@/lib/api/hooks/employer-ops';
import { CrewEditorPage } from '@/components/employer/crews/edit-crew/CrewEditorPage';
import { SkeletonCard } from '@/components/ui/skeleton';

function NewCrewInner() {
  const locale = useLocale();
  const { data: hires } = useActiveHiresSuspense();
  return (
    <CrewEditorPage
      locale={locale}
      mode="new"
      crew={null}
      members={[]}
      insights={{ yield: [], activity: [], skillCoverage: [] }}
      hires={hires}
    />
  );
}

export function NewCrewClient() {
  return (
    <Suspense fallback={<SkeletonCard rows={6} />}>
      <NewCrewInner />
    </Suspense>
  );
}
