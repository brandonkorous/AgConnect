'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { ThreadListItem } from '@/components/field/messages/ThreadListItem';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useMyMessageThreadsSuspense } from '@/lib/api/hooks/messages';

function FieldMessagesInner({ locale }: { locale: string }) {
  const t = useTranslations('worker.field.messages');
  const { data: page } = useMyMessageThreadsSuspense();
  const threads = page.threads;

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h1 className="text-base-content text-2xl font-semibold leading-tight">
          {t('title')}
        </h1>
        <p className="text-base-content/70 mt-1 text-sm">{t('subtitle')}</p>
      </div>
      {threads.length === 0 ? (
        <div className="bg-base-100 border-base-300 rounded-2xl border px-5 py-6 text-center">
          <h2 className="text-base-content text-xl font-semibold">{t('empty.title')}</h2>
          <p className="text-base-content/65 mx-auto mt-1.5 max-w-xs text-sm">
            {t('empty.body')}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {threads.map((thread) => (
            <ThreadListItem key={thread.id} locale={locale} thread={thread} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function FieldMessagesClient({ locale }: { locale: string }) {
  return (
    <Suspense fallback={<SkeletonCard rows={4} />}>
      <FieldMessagesInner locale={locale} />
    </Suspense>
  );
}
