import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ApplicationsClient } from './ApplicationsClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.applications_dense' });
  return { title: t('meta.title') };
}

export default function ApplicationsPage() {
  return <ApplicationsClient />;
}
