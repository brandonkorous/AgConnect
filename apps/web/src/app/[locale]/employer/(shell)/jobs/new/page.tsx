import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { NewJobClient } from './NewJobClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.jobs.list' });
  return { title: `AGCONN — ${t('new_posting')}` };
}

export default function NewJobPage() {
  return <NewJobClient />;
}
