import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PayClient } from './PayClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.pay' });
  return { title: t('meta.title') };
}

export default async function PayPage({ params }: Props) {
  const { locale } = await params;
  return <PayClient locale={locale} />;
}
