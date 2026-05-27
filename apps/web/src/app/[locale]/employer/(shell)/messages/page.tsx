import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { MessagesClient } from './MessagesClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.messages' });
  return { title: `AGCONN — ${t('title')}` };
}

export default function MessagesPage() {
  return <MessagesClient />;
}
