import { getTranslations } from 'next-intl/server';
import { StepShell } from '@/components/onboarding/StepShell';
import { AvailabilityGrid } from '@/components/onboarding/AvailabilityGrid';

type Props = { params: Promise<{ locale: string }> };

export default async function AvailabilityPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.onboarding.availability' });
  return (
    <StepShell
      step={6}
      total={8}
      title={t('title')}
      subtitle={t('subtitle')}
      locale={locale}
    >
      <AvailabilityGrid locale={locale} />
    </StepShell>
  );
}
