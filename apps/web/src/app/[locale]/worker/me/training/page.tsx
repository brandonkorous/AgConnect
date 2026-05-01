import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';

type Props = { params: Promise<{ locale: string }> };

export default async function MyTrainingPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.enrollments' });
  return (
    <div className="px-6 pb-16 pt-8 lg:px-8">
      <WorkerPageHeader title={t('title')} />
      <div className="border-base-300 grid gap-3 rounded-2xl border bg-white p-8 text-center">
        <p className="text-base-content/80 font-semibold">{t('empty.upcoming')}</p>
        <Link
          href={`/${locale}/training`}
          className="btn btn-primary btn-sm justify-self-center"
        >
          {t('empty.upcoming_cta')}
        </Link>
      </div>
    </div>
  );
}
