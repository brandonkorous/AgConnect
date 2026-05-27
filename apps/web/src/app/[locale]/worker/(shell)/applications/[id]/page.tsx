import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ApplicationDetailClient } from './ApplicationDetailClient';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.application.detail' });
  return { title: t('title') };
}

export default async function ApplicationDetailPage({ params }: Props) {
  const { id } = await params;
  return <ApplicationDetailClient id={id} />;
}
