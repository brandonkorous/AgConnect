import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ComplianceAuditClient } from './ComplianceAuditClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.compliance.audit' });
  return { title: `AGCONN — ${t('title')}` };
}

export default function ComplianceAuditPage() {
  return <ComplianceAuditClient />;
}
