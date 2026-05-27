'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { ApplyList } from '@/components/field/apply/ApplyList';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useRecommendedJobsSuspense } from '@/lib/api/hooks/jobs';

type SmsApply = { number: string; keyword: string } | null;

function FieldApplyInner({
  locale,
  smsApply,
}: {
  locale: string;
  smsApply: SmsApply;
}) {
  const t = useTranslations('worker.field.apply');
  const { data: jobs } = useRecommendedJobsSuspense();
  return (
    <div className="space-y-4">
      <div className="px-1">
        <h1 className="text-base-content text-2xl font-semibold leading-tight">
          {t('title')}
        </h1>
        <p className="text-base-content/70 mt-1 text-sm">{t('subtitle')}</p>
      </div>
      <ApplyList locale={locale} jobs={jobs} smsApply={smsApply} />
    </div>
  );
}

export function FieldApplyClient({
  locale,
  smsApply,
}: {
  locale: string;
  smsApply: SmsApply;
}) {
  return (
    <Suspense fallback={<SkeletonCard rows={4} />}>
      <FieldApplyInner locale={locale} smsApply={smsApply} />
    </Suspense>
  );
}
