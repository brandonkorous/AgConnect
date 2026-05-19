import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { fetchPublicJobs } from '@/lib/api/public-jobs';
import { PublicJobCard } from '@/components/jobs/PublicJobCard';
import { PublicShell } from '@/components/public/PublicShell';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ county?: string; cursor?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'public_jobs' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: {
      canonical: `/${locale}/jobs`,
      languages: {
        en: '/en/jobs',
        es: '/es/jobs',
      },
    },
  };
}

export default async function PublicJobsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'public_jobs' });
  const { jobs, nextCursor } = await fetchPublicJobs({
    county: sp.county,
    cursor: sp.cursor,
  });

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: jobs.map((j, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `/${locale}/jobs/${j.seoSlug}`,
      name: locale === 'es' ? j.titleEs : j.titleEn,
    })),
  };

  return (
    <PublicShell locale={locale} title={t('h1')}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <p className="text-base-content/70 mt-2 max-w-2xl text-[15px]">{t('intro')}</p>

      {jobs.length === 0 ? (
        <div className="border-base-300 bg-base-100 mt-8 rounded-2xl border p-8 text-center">
          <p className="text-base-content/70 text-[14px]">{t('empty')}</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {jobs.map((j) => (
            <PublicJobCard key={j.id} job={j} locale={locale} />
          ))}
        </div>
      )}

      {nextCursor && (
        <div className="mt-6 flex justify-center">
          <Link
            href={`/${locale}/jobs?cursor=${nextCursor}`}
            className="border-base-300 rounded-full border bg-white px-5 py-2.5 text-[13px] font-semibold no-underline"
          >
            {t('load_more')}
          </Link>
        </div>
      )}
    </PublicShell>
  );
}
