import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { StepShell } from '@/components/onboarding/StepShell';

type Props = { params: Promise<{ locale: string }> };

export default async function CompletePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.onboarding.complete' });
  return (
    <StepShell step={8} total={8} title={t('title')} locale={locale}>
      <div className="grid gap-6">
        <div className="bg-success/10 text-success grid place-items-center rounded-2xl py-10">
          <FontAwesomeIcon icon={faCircleCheck} className="h-14 w-14" />
        </div>
        <p className="text-base-content/80 text-base">{t('subtitle')}</p>
        <div className="grid gap-3">
          <Link href={`/${locale}/jobs`} className="btn btn-primary btn-lg w-full">
            {t('cta_jobs')}
          </Link>
          <Link href={`/${locale}/profile`} className="btn btn-outline btn-lg w-full">
            {t('cta_profile')}
          </Link>
        </div>
      </div>
    </StepShell>
  );
}
