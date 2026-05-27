import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { JobApplicantsClient } from './JobApplicantsClient';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.kanban' });
  return { title: `AGCONN — ${t('applied')}` };
}

export default async function JobApplicantsPage({ params }: Props) {
  const { id } = await params;
  return <JobApplicantsClient id={id} />;
}
