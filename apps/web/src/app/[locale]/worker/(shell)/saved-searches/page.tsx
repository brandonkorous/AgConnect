import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SavedSearchesPageClient } from './SavedSearchesPageClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.saved_searches' });
  return { title: t('meta.title') };
}

export default async function SavedSearchesPage({ params }: Props) {
  const { locale } = await params;
  return <SavedSearchesPageClient locale={locale} />;
}
