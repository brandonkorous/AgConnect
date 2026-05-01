import { getTranslations } from 'next-intl/server';
import { PublicShell } from '@/components/public/PublicShell';
import { ProgramCard } from '@/components/training/ProgramCard';
import { fetchTraining } from '@/lib/api/server';

type Props = { params: Promise<{ locale: string }> };

export default async function TrainingPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.training' });
  const programs = await fetchTraining();

  return (
    <PublicShell locale={locale} title={t('title')} maxWidth="lg">
      <p className="text-base-content/70 mb-6">{t('subtitle')}</p>
      {programs.length === 0 ? (
        <div className="border-base-300 grid gap-3 rounded-2xl border bg-white p-8 text-center">
          <p className="font-semibold">{t('empty')}</p>
          <p className="text-base-content/60 text-sm">{t('empty_help')}</p>
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
