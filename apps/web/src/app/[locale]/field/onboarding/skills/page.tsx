import { getTranslations } from 'next-intl/server';
import { StepShell } from '@/components/onboarding/StepShell';
import { SkillsPicker } from '@/components/onboarding/SkillsPicker';

type Props = { params: Promise<{ locale: string }> };

export default async function SkillsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.onboarding' });
  return (
    <StepShell
      step={5}
      total={8}
      title={t('skill.title')}
      subtitle={t('skill.subtitle')}
      locale={locale}
    >
      <SkillsPicker locale={locale} />
    </StepShell>
  );
}
