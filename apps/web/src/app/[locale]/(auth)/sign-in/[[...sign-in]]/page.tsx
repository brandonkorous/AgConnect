import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AuthSplitShell } from '@/components/auth/AuthSplitShell';
import { SignInForm } from '@/components/auth/SignInForm';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth.sign_in' });
  return { title: t('meta_title') };
}

export default async function SignInPage({ params }: Props) {
  const { locale } = await params;
  return (
    <AuthSplitShell locale={locale} variant="sign_in">
      <SignInForm locale={locale} />
    </AuthSplitShell>
  );
}
