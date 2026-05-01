import { redirect } from 'next/navigation';

type Props = { params: Promise<{ locale: string }> };

export default async function OnboardingIndex({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/onboarding/welcome`);
}
