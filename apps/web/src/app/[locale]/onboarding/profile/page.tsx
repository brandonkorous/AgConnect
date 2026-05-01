import { getTranslations } from 'next-intl/server';
import { StepShell } from '@/components/onboarding/StepShell';
import { NameForm } from '@/components/onboarding/NameForm';

type Props = { params: Promise<{ locale: string }> };

export default async function ProfileReviewPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.onboarding' });
  return (
    <StepShell
      step={3}
      total={8}
      title={t('profile.title')}
      subtitle={t('profile.subtitle')}
      locale={locale}
    >
      <NameForm locale={locale} />
    </StepShell>
  );
}
