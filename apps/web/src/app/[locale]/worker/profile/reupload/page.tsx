import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';
import { ResumeUpload } from '@/components/onboarding/ResumeUpload';

type Props = { params: Promise<{ locale: string }> };

export default async function ReuploadPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.profile.reupload' });
  return (
    <div className="px-6 pb-16 pt-8 lg:px-8">
      <WorkerPageHeader title={t('confirm.title')} sub={t('confirm.body')} />
      <div className="border-base-300 grid gap-4 rounded-2xl border bg-white p-5">
        <ResumeUpload locale={locale} />
        <Link href={`/${locale}/worker/profile`} className="btn btn-ghost">
          {t('cancel')}
        </Link>
      </div>
    </div>
  );
}
