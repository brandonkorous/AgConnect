import { getTranslations } from 'next-intl/server';
import { OnboardingSplitShell } from '@/components/onboarding/OnboardingSplitShell';
import { NameForm } from '@/components/onboarding/NameForm';
import { fetchOnboardingDraft } from '@/lib/api/onboarding';

type Props = { params: Promise<{ locale: string }> };

export default async function ProfileReviewPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.onboarding' });
  const draft = await fetchOnboardingDraft();
  return (
    <OnboardingSplitShell
      step={3}
      total={8}
      title={t('profile.title')}
      subtitle={t('profile.subtitle')}
      locale={locale}
    >
      <NameForm
        locale={locale}
        initialFirst={draft.firstName ?? ''}
        initialLast={draft.lastName ?? ''}
      />
    </OnboardingSplitShell>
  );
}
