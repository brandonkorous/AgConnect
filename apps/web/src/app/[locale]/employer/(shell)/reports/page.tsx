import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ReportsClient } from './ReportsClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.reports' });
  return { title: `AGCONN — ${t('title')}` };
}

export default function ReportsPage() {
  return <ReportsClient />;
}
