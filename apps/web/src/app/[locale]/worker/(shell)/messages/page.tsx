import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { MessagesClient } from './MessagesClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.messages' });
  return { title: t('meta.title') };
}

export default async function MessagesPage({ params }: Props) {
  const { locale } = await params;
  return <MessagesClient locale={locale} />;
}
