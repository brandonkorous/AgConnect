import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { DashboardClient } from './DashboardClient';

type Props = { params: Promise<{ locale: string }> };

// Thin server entry. Metadata stays server-rendered for SEO/social;
// everything visible to the worker is in <DashboardClient>.

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.dashboard.meta' });
  return { title: t('title') };
}

export default function WorkerDashboardPage() {
  return <DashboardClient />;
}
