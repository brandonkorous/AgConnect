'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useCrewsSuspense } from '@/lib/api/hooks/employer-ops';
import { NewShiftPage } from '@/components/employer/crews/new-shift/NewShiftPage';
import { SkeletonCard } from '@/components/ui/skeleton';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function NewShiftInner() {
  const locale = useLocale();
  const sp = useSearchParams();
  const crewIdParam = sp.get('crewId') ?? undefined;
  const dateParam = sp.get('date') ?? undefined;
  const { data: crews } = useCrewsSuspense();
  const defaultCrewId = crewIdParam && crews.some((c) => c.id === crewIdParam) ? crewIdParam : undefined;
  const defaultDate = dateParam && DATE_RE.test(dateParam) ? dateParam : undefined;
  return (
    <NewShiftPage
      locale={locale}
      crews={crews}
      defaultCrewId={defaultCrewId}
      defaultDate={defaultDate}
    />
  );
}

export function NewShiftClient() {
  return (
    <Suspense fallback={<SkeletonCard rows={6} />}>
      <NewShiftInner />
    </Suspense>
  );
}
