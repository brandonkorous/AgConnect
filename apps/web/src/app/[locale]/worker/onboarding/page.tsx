import { redirect } from 'next/navigation';
import { onboardingPath } from '@/lib/onboarding-steps';

type Props = { params: Promise<{ locale: string }> };

export default async function OnboardingIndex({ params }: Props) {
  const { locale } = await params;
  redirect(onboardingPath(locale, 'welcome'));
}
