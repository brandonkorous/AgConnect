import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ProfileClient } from './ProfileClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.profile' });
  return { title: `AGCONN — ${t('title')}` };
}

export default function EmployerProfilePage() {
  return <ProfileClient />;
}
