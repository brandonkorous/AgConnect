import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ComplianceClient } from './ComplianceClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.compliance' });
  return { title: `AGCONN — ${t('title')}` };
}

export default function CompliancePage() {
  return <ComplianceClient />;
}
