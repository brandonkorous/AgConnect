import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TeamClient } from './TeamClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.team' });
  return { title: `AGCONN — ${t('title')}` };
}

export default function EmployerTeamPage() {
  return <TeamClient />;
}
