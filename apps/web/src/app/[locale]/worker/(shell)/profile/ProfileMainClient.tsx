'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';
import { ProfileEditor } from '@/components/profile/ProfileEditor';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useProfileSuspense } from '@/lib/api/hooks/profile';

function ProfileMainInner({ locale }: { locale: string }) {
  const t = useTranslations('worker.profile');
  const { data: initial } = useProfileSuspense();
  return (
    <div className="px-6 pb-16 pt-8 lg:px-8">
      <WorkerPageHeader
        title={t('title')}
        sub={t('subtitle')}
        right={
          <Link
            href={`/${locale}/worker/profile/preview`}
            className="border-base-300 inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-2.5 text-[13px] font-semibold"
          >
            {t('preview_as_employer')}
          </Link>
        }
      />
      <ProfileEditor locale={locale} initial={initial} />
    </div>
  );
}

export function ProfileMainClient({ locale }: { locale: string }) {
  return (
    <Suspense fallback={<SkeletonCard rows={8} />}>
      <ProfileMainInner locale={locale} />
    </Suspense>
  );
}
