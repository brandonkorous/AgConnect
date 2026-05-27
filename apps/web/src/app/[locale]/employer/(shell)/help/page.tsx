import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { HelpClient } from './HelpClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.help' });
  return { title: `AGCONN — ${t('title')}` };
}

export default function EmployerHelpPage() {
  return <HelpClient />;
}
