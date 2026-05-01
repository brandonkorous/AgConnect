import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';
import { FoldersRail } from '@/components/worker/messages/FoldersRail';
import { ThreadList } from '@/components/worker/messages/ThreadList';
import { ThreadView } from '@/components/worker/messages/ThreadView';
import { MessagesActions } from '@/components/worker/messages/MessagesActions';
import {
  fetchMyMessageThreads,
  fetchMyMessageThread,
  type Thread,
} from '@/lib/api/me';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ thread?: string; folder?: string; channel?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.messages' });
  return { title: t('meta.title') };
}

type FolderKey = 'all' | 'employers' | 'foremen' | 'agconn';

function applyFilters(
  threads: Thread[],
  folder: FolderKey,
  channel: string | undefined,
): Thread[] {
  let out = threads;
  if (folder === 'employers') out = out.filter((th) => !th.employer.toLowerCase().includes('agconn'));
  else if (folder === 'agconn') out = out.filter((th) => th.employer.toLowerCase().includes('agconn'));
  else if (folder === 'foremen') out = out;
  if (channel === 'sms' || channel === 'whatsapp' || channel === 'app') {
    out = out.filter((th) => th.channel === channel);
  }
  return out;
}

export default async function MessagesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'worker.messages' });
  const { threads, totalUnread } = await fetchMyMessageThreads();

  const folder = (sp.folder as FolderKey) ?? 'all';
  const channel = sp.channel;
  const visible = applyFilters(threads, folder, channel);
  const activeThreadId = sp.thread ?? visible[0]?.id ?? threads[0]?.id;
  const detail = activeThreadId ? await fetchMyMessageThread(activeThreadId) : null;

  return (
    <div className="px-8 pb-16 pt-8">
      <WorkerPageHeader
        eyebrow={t('eyebrow_n', {
          unread: totalUnread,
          count: threads.length,
          defaultMessage: t('eyebrow'),
        })}
        title={
          <>
            {t('title.lead')}{' '}
            <em className="text-primary font-light not-italic">{t('title.em')}</em>
            .
          </>
        }
        sub={t('sub')}
        right={<MessagesActions locale={locale} totalUnread={totalUnread} />}
      />

      {threads.length === 0 ? (
        <div className="border-base-300 bg-base-100 grid place-items-center rounded-2xl border p-12 text-center">
          <p className="text-base-content/70 text-[14px]">
            {locale === 'es'
              ? 'No tienes conversaciones todavía. Cuando un empleador te contacte, aparecerá aquí.'
              : "You don't have any conversations yet. When an employer contacts you, they'll appear here."}
          </p>
        </div>
      ) : (
        <div className="border-base-300 bg-base-100 grid min-h-[640px] overflow-hidden rounded-2xl border lg:grid-cols-[180px_1fr_1.4fr]">
          <FoldersRail
            locale={locale}
            counts={folderCounts(threads)}
            folder={folder}
            channel={channel}
          />
          <ThreadList threads={visible} activeId={activeThreadId} locale={locale} />
          {detail ? (
            <ThreadView detail={detail} locale={locale} />
          ) : (
            <div className="grid place-items-center p-8 text-center">
              <p className="text-base-content/60 text-[13px]">
                {locale === 'es' ? 'Selecciona una conversación' : 'Select a conversation'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function folderCounts(threads: Thread[]): Record<string, number> {
  const counts: Record<string, number> = {
    all: threads.length,
    employers: 0,
    foremen: 0,
    agconn: 0,
  };
  for (const t of threads) {
    if (t.employer.toLowerCase().includes('agconn')) counts.agconn = (counts.agconn ?? 0) + 1;
    else counts.employers = (counts.employers ?? 0) + 1;
  }
  return counts;
}
