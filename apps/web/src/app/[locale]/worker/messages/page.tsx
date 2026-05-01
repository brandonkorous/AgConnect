import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPlus } from '@fortawesome/free-solid-svg-icons';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';
import { FoldersRail } from '@/components/worker/messages/FoldersRail';
import { ThreadList } from '@/components/worker/messages/ThreadList';
import { ThreadView } from '@/components/worker/messages/ThreadView';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.messages' });
  return { title: t('meta.title') };
}

export default async function MessagesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.messages' });
  return (
    <div className="px-8 pb-16 pt-8">
      <WorkerPageHeader
        eyebrow={t('eyebrow')}
        title={
          <>
            {t('title.lead')}{' '}
            <em className="text-primary font-light not-italic">{t('title.em')}</em>
            .
          </>
        }
        sub={t('sub')}
        right={
          <>
            <button
              type="button"
              className="border-base-300 inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-2 text-[13px] font-semibold"
            >
              <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
              {t('cta_mark_read')}
            </button>
            <button type="button" className="btn btn-primary btn-sm rounded-full">
              <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
              {t('cta_new')}
            </button>
          </>
        }
      />

      <div className="border-base-300 bg-base-100 grid min-h-[640px] overflow-hidden rounded-2xl border lg:grid-cols-[180px_1fr_1.4fr]">
        <FoldersRail />
        <ThreadList />
        <ThreadView />
      </div>
    </div>
  );
}
