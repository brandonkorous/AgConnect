import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EditJobClient } from './EditJobClient';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.jobs.list' });
  return { title: `AGCONN — ${t('edit_posting')}` };
}

export default async function EditJobPage({ params }: Props) {
  const { id } = await params;
  return <EditJobClient id={id} />;
}
