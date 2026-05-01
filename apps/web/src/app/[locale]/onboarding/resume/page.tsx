import { getTranslations } from 'next-intl/server';
import { StepShell } from '@/components/onboarding/StepShell';
import { ResumeUpload } from '@/components/onboarding/ResumeUpload';

type Props = { params: Promise<{ locale: string }> };

export default async function ResumePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.onboarding' });

  return (
    <StepShell step={2} total={8} title={t('resume.title')} locale={locale}>
      <ResumeUpload locale={locale} />
    </StepShell>
  );
}
