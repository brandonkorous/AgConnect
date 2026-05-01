import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';

type Props = { params: Promise<{ locale: string }> };

export default async function SavedSearchesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.jobs.saved' });
  return (
    <div className="px-6 pb-16 pt-8 lg:px-8">
      <WorkerPageHeader title={t('title')} />
      <div className="border-base-300 grid gap-3 rounded-2xl border bg-white p-6 text-center">
        <p className="text-base-content/80 font-semibold">{t('empty')}</p>
        <p className="text-base-content/60 text-sm">{t('empty_help')}</p>
        <Link
          href={`/${locale}/worker/jobs`}
          className="btn btn-primary btn-sm mt-2"
        >
          {t('go_jobs')}
        </Link>
      </div>
    </div>
  );
}
