import { getTranslations } from 'next-intl/server';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';

type Props = { params: Promise<{ locale: string }> };

export default async function PreviewAsEmployer({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.profile.preview' });
  return (
    <div className="px-6 pb-16 pt-8 lg:px-8">
      <WorkerPageHeader title={t('title')} />
      <div className="border-base-300 grid gap-4 rounded-2xl border bg-white p-6">
        <span className="bg-warning/15 text-warning self-start rounded-full px-3 py-1 text-xs font-semibold uppercase">
          {t('badge')}
        </span>
        <p className="text-base-content/80">{t('privacy')}</p>
        <p className="text-base-content/60 text-sm">{t('empty')}</p>
      </div>
    </div>
  );
}
