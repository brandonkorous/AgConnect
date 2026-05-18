import { redirect } from 'next/navigation';
import { onboardingPath } from '@/lib/onboarding-steps';

type Props = { params: Promise<{ locale: string }> };

// Language is captured at /welcome via the LangChoice component; this route
// exists per spec but immediately advances the worker to resume upload.
export default async function LanguagePage({ params }: Props) {
  const { locale } = await params;
  redirect(onboardingPath(locale, 'resume'));
}
