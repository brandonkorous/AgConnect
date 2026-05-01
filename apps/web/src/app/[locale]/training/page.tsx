import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PublicShell } from '@/components/public/PublicShell';
import { ProgramCard } from '@/components/training/ProgramCard';
import { fetchPublicTrainingPrograms } from '@/lib/api/public-training';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ funder?: string; cursor?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'public_training' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: {
      canonical: `/${locale}/training`,
      languages: { en: '/en/training', es: '/es/training' },
    },
  };
}

export default async function TrainingPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'public_training' });
  const tWorker = await getTranslations({ locale, namespace: 'worker.training' });
  const { programs } = await fetchPublicTrainingPrograms({
    funder: sp.funder,
    cursor: sp.cursor,
  });

  return (
    <PublicShell locale={locale} title={t('h1')} maxWidth="lg">
      <p className="text-base-content/70 mb-6 max-w-2xl text-[15px]">{t('intro')}</p>
      {programs.length === 0 ? (
        <div className="border-base-300 grid gap-3 rounded-2xl border bg-white p-8 text-center">
          <p className="font-semibold">{tWorker('empty')}</p>
          <p className="text-base-content/60 text-sm">{tWorker('empty_help')}</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {programs.map((p) => (
            <ProgramCard key={p.id} program={p} locale={locale} />
          ))}
        </div>
      )}
    </PublicShell>
  );
}
