import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { fetchRecommendedJobs } from '@/lib/api/jobs';
import { MatchedJobsClient } from './MatchedJobsClient';

type Props = { locale: string };

export async function MatchedJobs({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'worker.dashboard.matched' });
  const jobs = await fetchRecommendedJobs();

  return (
    <section>
      <header className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-medium tracking-tight">
            {t('title')}
          </h2>
          <p className="text-base-content/60 mt-0.5 text-sm">{t('subtitle')}</p>
        </div>
      </header>
      {jobs.length === 0 ? (
        <div className="border-base-300 bg-base-100 rounded-2xl border p-6 text-center">
          <p className="text-base-content/70 text-sm">
            {locale === 'es'
              ? 'No tenemos coincidencias todavía. Completa tu perfil para mejorarlas.'
              : "No matches yet. Complete your profile so we can show better picks."}
          </p>
          <Link
            href={`/${locale}/worker/jobs`}
            className="btn btn-primary btn-sm mt-3 rounded-full"
          >
            {locale === 'es' ? 'Buscar trabajos' : 'Browse jobs'}
          </Link>
        </div>
      ) : (
        <MatchedJobsClient
          jobs={jobs}
          locale={locale}
          labels={{
            all: t('filters.all'),
            within25: t('filters.within_25'),
            thisWeek: t('filters.this_week'),
            pays22: t('filters.pays_22'),
            empty: locale === 'es' ? 'Sin resultados' : 'No matches',
          }}
        />
      )}
    </section>
  );
}
