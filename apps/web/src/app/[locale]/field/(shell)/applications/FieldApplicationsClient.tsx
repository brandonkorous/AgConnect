'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { MyApplicationsList } from '@/components/field/applications/MyApplicationsList';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useApplicationsSuspense } from '@/lib/api/hooks/applications';

function FieldApplicationsInner({ locale }: { locale: string }) {
  const t = useTranslations('worker.field.applications');
  const { data: page } = useApplicationsSuspense('all');
  return (
    <div className="space-y-4">
      <div className="px-1">
        <h1 className="text-base-content text-2xl font-semibold leading-tight">
          {t('title')}
        </h1>
        <p className="text-base-content/70 mt-1 text-sm">{t('subtitle')}</p>
      </div>
      <MyApplicationsList locale={locale} applications={page.applications} />
    </div>
  );
}

export function FieldApplicationsClient({ locale }: { locale: string }) {
  return (
    <Suspense fallback={<SkeletonCard rows={4} />}>
      <FieldApplicationsInner locale={locale} />
    </Suspense>
  );
}
