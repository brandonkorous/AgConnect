'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';
import { SavedSearchesClient } from '@/components/saved-searches/SavedSearchesClient';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useSavedSearchesSuspense } from '@/lib/api/hooks/saved-searches';

function SavedSearchesInner({ locale }: { locale: string }) {
  const t = useTranslations('worker.saved_searches');
  const { data: initial } = useSavedSearchesSuspense();
  return (
    <div className=" px-5 pb-16 pt-8">
      <WorkerPageHeader
        eyebrow={t('eyebrow')}
        title={
          <>
            {t('title.lead')}{' '}
            <em className="text-primary font-light italic">{t('title.em')}</em>.
          </>
        }
        sub={t('sub')}
      />
      <SavedSearchesClient locale={locale} initial={initial} />
    </div>
  );
}

export function SavedSearchesPageClient({ locale }: { locale: string }) {
  return (
    <Suspense fallback={<SkeletonCard rows={6} />}>
      <SavedSearchesInner locale={locale} />
    </Suspense>
  );
}
