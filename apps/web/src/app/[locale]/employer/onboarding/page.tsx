import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { OnboardingForm } from '@/components/employer/OnboardingForm';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.onboarding' });
  return { title: t('title') };
}

export default async function EmployerOnboardingPage({ params }: Props) {
  const { locale } = await params;
  return (
    <div className="bg-base-200 min-h-screen px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <OnboardingForm locale={locale} />
      </div>
    </div>
  );
}
