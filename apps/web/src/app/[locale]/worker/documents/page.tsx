import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faPlus } from '@fortawesome/free-solid-svg-icons';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';
import { CompletenessCard } from '@/components/worker/documents/CompletenessCard';
import { DocumentGroup } from '@/components/worker/documents/DocumentGroup';
import { RecentSharesTable } from '@/components/worker/documents/RecentSharesTable';
import { GROUPS } from '@/components/worker/documents/documentsMockData';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.documents' });
  return { title: t('meta.title') };
}

export default async function DocumentsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.documents' });
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
              <FontAwesomeIcon icon={faDownload} className="h-3 w-3" />
              {t('cta_download')}
            </button>
            <button type="button" className="btn btn-primary btn-sm rounded-full">
              <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
              {t('cta_upload')}
            </button>
          </>
        }
      />

      <CompletenessCard />
      {GROUPS.map((g) => (
        <DocumentGroup key={g.key} group={g} />
      ))}
      <RecentSharesTable />
    </div>
  );
}
