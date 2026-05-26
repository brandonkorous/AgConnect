import { getTranslations } from 'next-intl/server';
import { StepShell } from '@/components/onboarding/StepShell';
import { CountyPicker } from '@/components/onboarding/CountyPicker';

type Props = { params: Promise<{ locale: string }> };

export default async function CountyPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.onboarding' });
  return (
    <StepShell
      step={4}
      total={8}
      title={t('county.title')}
      subtitle={t('county.subtitle')}
      locale={locale}
    >
      <CountyPicker locale={locale} />
    </StepShell>
  );
}
