'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';
import { FoldersRail } from '@/components/worker/messages/FoldersRail';
import { ThreadList } from '@/components/worker/messages/ThreadList';
import { ThreadView } from '@/components/worker/messages/ThreadView';
import { MessagesActions } from '@/components/worker/messages/MessagesActions';
import { SkeletonCard } from '@/components/ui/skeleton';
import {
  useMyMessageThreadsSuspense,
  useMyMessageThreadSuspense,
  type Thread,
} from '@/lib/api/hooks/messages';

type FolderKey = 'all' | 'employers' | 'foremen' | 'agconn';

function applyFilters(
  threads: Thread[],
  folder: FolderKey,
  channel: string | undefined,
): Thread[] {
  let out = threads;
  if (folder === 'employers') {
    out = out.filter((th) => !th.employer.toLowerCase().includes('agconn'));
  } else if (folder === 'agconn') {
    out = out.filter((th) => th.employer.toLowerCase().includes('agconn'));
  }
  if (channel === 'sms' || channel === 'app') {
    out = out.filter((th) => th.channel === channel);
  }
  return out;
}

function folderCounts(threads: Thread[]): Record<string, number> {
  const counts: Record<string, number> = {
    all: threads.length,
    employers: 0,
    foremen: 0,
    agconn: 0,
  };
  for (const th of threads) {
    if (th.employer.toLowerCase().includes('agconn')) {
      counts.agconn = (counts.agconn ?? 0) + 1;
    } else {
      counts.employers = (counts.employers ?? 0) + 1;
    }
  }
  return counts;
}

function MessagesInner({ locale }: { locale: string }) {
  const t = useTranslations('worker.messages');
  const search = useSearchParams();
  const folder = (search.get('folder') as FolderKey | null) ?? 'all';
  const channel = search.get('channel') ?? undefined;
  const threadParam = search.get('thread') ?? undefined;

  const { data: page } = useMyMessageThreadsSuspense();
  const threads = page.threads;
  const totalUnread = page.totalUnread;

  const visible = useMemo(
    () => applyFilters(threads, folder, channel),
    [threads, folder, channel],
  );
  const activeThreadId = threadParam ?? visible[0]?.id ?? threads[0]?.id;

  return (
    <div className="px-5 pb-16 pt-8 flex flex-col flex-1 min-h-0">
      <WorkerPageHeader
        eyebrow={t('eyebrow_n', { unread: totalUnread, count: threads.length })}
        title={
          <>
            {t('title.lead')}{' '}
            <em className="text-primary font-light italic">{t('title.em')}</em>.
          </>
        }
        sub={t('sub')}
        right={<MessagesActions locale={locale} totalUnread={totalUnread} />}
      />

      {threads.length === 0 ? (
        <div className="border-base-300 bg-base-100 grid place-items-center rounded-2xl border p-12 text-center">
          <p className="text-base-content/70 text-[14px]">{t('empty.body')}</p>
        </div>
      ) : (
        <div className="border-base-300 bg-base-100 flex flex-1 min-h-0 overflow-hidden rounded-2xl border">
          <FoldersRail
            locale={locale}
            counts={folderCounts(threads)}
            folder={folder}
            channel={channel}
          />
          <ThreadList threads={visible} activeId={activeThreadId} locale={locale} />
          {activeThreadId ? (
            <Suspense fallback={<ThreadFallback />}>
              <ThreadDetailPane id={activeThreadId} locale={locale} />
            </Suspense>
          ) : (
            <div className="grid place-items-center p-8 text-center grow-8">
              <p className="text-base-content/60 text-[13px]">
                {t('empty.select_thread')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ThreadDetailPane({ id, locale }: { id: string; locale: string }) {
  const { data: detail } = useMyMessageThreadSuspense(id);
  return <ThreadView detail={detail} locale={locale} />;
}

function ThreadFallback() {
  return (
    <div className="grow-8 p-5">
      <SkeletonCard rows={6} />
    </div>
  );
}

export function MessagesClient({ locale }: { locale: string }) {
  return (
    <Suspense fallback={<SkeletonCard rows={6} />}>
      <MessagesInner locale={locale} />
    </Suspense>
  );
}
