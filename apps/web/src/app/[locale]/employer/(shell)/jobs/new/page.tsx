import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { JobForm } from '@/components/employer/JobForm';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.jobs.list' });
  return { title: `AgConn — ${t('new_posting')}` };
}

export default async function NewJobPage({ params }: Props) {
  const { locale } = await params;
  return (
    <div className="px-8 pb-16 pt-8">
      <JobForm locale={locale} mode="create" />
    </div>
  );
}
