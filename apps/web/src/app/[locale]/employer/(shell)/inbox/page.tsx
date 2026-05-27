import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { InboxClient } from './InboxClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.candidates' });
  return { title: `AGCONN — ${t('title')}` };
}

export default function CandidatesPage() {
  return <InboxClient />;
}
