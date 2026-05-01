import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';
import { SavedSearchesClient } from '@/components/saved-searches/SavedSearchesClient';
import { fetchSavedSearches } from '@/lib/api/saved-searches';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.saved_searches' });
  return { title: t('meta.title') };
}

export default async function SavedSearchesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.saved_searches' });
  const initial = await fetchSavedSearches();
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
      />
      <SavedSearchesClient locale={locale} initial={initial} />
    </div>
  );
}
