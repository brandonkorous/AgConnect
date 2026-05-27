import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { WageStatementClient } from './WageStatementClient';

type Props = { params: Promise<{ locale: string; periodId: string; lineId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.payroll.wage_statement' });
  return { title: `AGCONN — ${t('title')}` };
}

export default async function WageStatementPage({ params }: Props) {
  const { periodId, lineId } = await params;
  return <WageStatementClient periodId={periodId} lineId={lineId} />;
}
