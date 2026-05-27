'use client';

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  useShiftSuspense,
  useCrewsSuspense,
  useActiveHiresSuspense,
} from '@/lib/api/hooks/employer-ops';
import { EditShiftPage } from '@/components/employer/crews/edit-shift/EditShiftPage';
import { SkeletonCard } from '@/components/ui/skeleton';

function EditShiftInner({ id }: { id: string }) {
  const locale = useLocale();
  const { data: detail } = useShiftSuspense(id);
  const { data: crews } = useCrewsSuspense();
  const { data: hires } = useActiveHiresSuspense();
  if (!detail) notFound();
  return (
    <EditShiftPage
      locale={locale}
      shift={detail.shift}
      assignments={detail.assignments}
      crews={crews}
      hires={hires}
    />
  );
}

export function EditShiftClient({ id }: { id: string }) {
  return (
    <Suspense fallback={<SkeletonCard rows={6} />}>
      <EditShiftInner id={id} />
    </Suspense>
  );
}
