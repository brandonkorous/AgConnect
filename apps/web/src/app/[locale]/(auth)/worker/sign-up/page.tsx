import type { Metadata } from 'next';
import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getTranslations } from 'next-intl/server';
import { AuthSplitShell } from '@/components/auth/AuthSplitShell';
import { WorkerSignUpForm } from '@/components/auth/WorkerSignUpForm';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth.sign_up_worker' });
  return { title: t('meta_title') };
}

export default async function WorkerSignUpPage({ params }: Props) {
  const { locale } = await params;
  const { userId } = await auth();
  if (userId) redirect(`/${locale}/post-auth` as Route);
  return (
    <AuthSplitShell locale={locale} variant="worker">
      <WorkerSignUpForm locale={locale} />
    </AuthSplitShell>
  );
}
