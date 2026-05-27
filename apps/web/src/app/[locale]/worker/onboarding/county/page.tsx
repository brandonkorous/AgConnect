import { getTranslations } from 'next-intl/server';
import { OnboardingSplitShell } from '@/components/onboarding/OnboardingSplitShell';
import { CountyPicker } from '@/components/onboarding/CountyPicker';
import { fetchOnboardingDraft } from '@/lib/api/onboarding';

type Props = { params: Promise<{ locale: string }> };

export default async function CountyPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.onboarding' });
  const draft = await fetchOnboardingDraft();
  return (
    <OnboardingSplitShell
      step={4}
      total={8}
      title={t('county.title')}
      subtitle={t('county.subtitle')}
      locale={locale}
    >
      <CountyPicker locale={locale} initialCounty={draft.county} />
    </OnboardingSplitShell>
  );
}
