import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ShiftsClient } from './ShiftsClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.shifts' });
  return { title: t('meta.title') };
}

export default async function ShiftsPage({ params }: Props) {
  const { locale } = await params;
  return <ShiftsClient locale={locale} />;
}
