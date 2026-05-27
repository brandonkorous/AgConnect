import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FieldShiftsClient } from './FieldShiftsClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.field.shifts' });
  return { title: t('meta_title') };
}

export default async function FieldShiftsPage({ params }: Props) {
  const { locale } = await params;
  return <FieldShiftsClient locale={locale} />;
}
