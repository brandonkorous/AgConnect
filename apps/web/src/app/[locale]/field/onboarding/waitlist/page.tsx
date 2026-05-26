import { getTranslations } from 'next-intl/server';
import { StepShell } from '@/components/onboarding/StepShell';
import { OnboardingWaitlistForm } from '@/components/onboarding/WaitlistForm';

type Props = { params: Promise<{ locale: string }> };

export default async function OnboardingWaitlistPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.onboarding.waitlist' });
  return (
    <StepShell step={4} total={8} title={t('title')} locale={locale}>
      <OnboardingWaitlistForm locale={locale === 'es' ? 'es' : 'en'} />
    </StepShell>
  );
}
