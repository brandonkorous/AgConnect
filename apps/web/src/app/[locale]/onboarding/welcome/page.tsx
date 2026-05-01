import { getTranslations } from 'next-intl/server';
import { StepShell } from '@/components/onboarding/StepShell';
import { LangChoice } from '@/components/onboarding/LangChoice';

type Props = { params: Promise<{ locale: string }> };

export default async function WelcomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.onboarding' });

  return (
    <StepShell
      step={1}
      total={8}
      title={t('welcome.tagline')}
      locale={locale}
    >
      <p className="text-base-content/70 mb-6">{t('welcome.choose_lang')}</p>
      <LangChoice locale={locale} nextHref={`/${locale}/sign-in`} />
    </StepShell>
  );
}
