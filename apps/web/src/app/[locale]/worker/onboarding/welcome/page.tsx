import { getTranslations } from 'next-intl/server';
import { OnboardingSplitShell } from '@/components/onboarding/OnboardingSplitShell';
import { LangChoice } from '@/components/onboarding/LangChoice';
import { onboardingPath } from '@/lib/onboarding-steps';

type Props = { params: Promise<{ locale: string }> };

export default async function WelcomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.onboarding' });

  return (
    <OnboardingSplitShell
      step={1}
      total={8}
      title={t('welcome.tagline')}
      subtitle={t('welcome.choose_lang')}
      locale={locale}
    >
      <LangChoice locale={locale} nextHref={onboardingPath(locale, 'language', 'worker')} />
    </OnboardingSplitShell>
  );
}
