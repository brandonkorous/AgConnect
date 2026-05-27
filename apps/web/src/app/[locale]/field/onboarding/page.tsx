import { redirect } from 'next/navigation';
import { onboardingPath } from '@/lib/onboarding-steps';
import { apiNextStepToWebStep, fetchOnboardingDraft } from '@/lib/api/onboarding';

type Props = { params: Promise<{ locale: string }> };

// Index entry — picks the first incomplete step, honoring SMS-side draft so a
// worker who started over SMS skips ahead past name/county etc.
export default async function OnboardingIndex({ params }: Props) {
  const { locale } = await params;
  const draft = await fetchOnboardingDraft();
  redirect(onboardingPath(locale, apiNextStepToWebStep(draft.nextStep), 'field'));
}
