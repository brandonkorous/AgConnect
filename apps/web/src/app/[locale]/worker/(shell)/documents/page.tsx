import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { DocumentsClient } from './DocumentsClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.documents' });
  return { title: t('meta.title') };
}

export default async function DocumentsPage({ params }: Props) {
  const { locale } = await params;
  return <DocumentsClient locale={locale} />;
}
