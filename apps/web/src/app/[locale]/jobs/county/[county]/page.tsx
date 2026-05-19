import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { SERVICE_COUNTIES, countyFromSlug } from '@agconn/schemas';
import { fetchCountyJobs, type PublicJob } from '@/lib/api/public-jobs';
import { PublicJobCard } from '@/components/jobs/PublicJobCard';
import { PublicShell } from '@/components/public/PublicShell';
import { marketingMetadata, getSiteUrl, type Locale } from '@/lib/seo/metadata';
import { breadcrumbJsonLd, faqPageJsonLd } from '@/lib/seo/json-ld';

export const dynamicParams = false;

type Props = { params: Promise<{ locale: string; county: string }> };

export function generateStaticParams() {
  return SERVICE_COUNTIES.map((county) => ({ county }));
}

const DISPLAY_LIMIT = 24;
const MEDIAN_MIN = 3;

const asLocale = (l: string): Locale => (l === 'es' ? 'es' : 'en');

// next-intl's typed `t` rejects computed keys; county.<slug>.* is data-driven.
type Tx = (key: string, values?: Record<string, string | number>) => string;

function median(nums: number[]): number | null {
  if (nums.length < MEDIAN_MIN) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

function fmtMoney(n: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

function topRole(jobs: PublicJob[], locale: Locale): string {
  const counts = new Map<string, { n: number; sample: PublicJob }>();
  for (const j of jobs) {
    const entry = counts.get(j.titleEn);
    if (entry) entry.n += 1;
    else counts.set(j.titleEn, { n: 1, sample: j });
  }
  let best: { n: number; sample: PublicJob } | null = null;
  for (const e of counts.values()) if (!best || e.n > best.n) best = e;
  if (!best) return '';
  return locale === 'es' ? best.sample.titleEs : best.sample.titleEn;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, county } = await params;
  if (!countyFromSlug(county)) return {};
  const t = (await getTranslations({ locale, namespace: 'landing' })) as unknown as Tx;
  return marketingMetadata({
    locale: asLocale(locale),
    title: t(`county.${county}.meta_title`),
    description: t(`county.${county}.meta_description`),
    pathByLocale: (l) => `/${l}/jobs/county/${county}`,
  });
}

export default async function CountyJobsPage({ params }: Props) {
  const { locale, county } = await params;
  const countyDb = countyFromSlug(county);
  if (!countyDb) notFound();

  const loc = asLocale(locale);
  const t = (await getTranslations({ locale, namespace: 'landing' })) as unknown as Tx;
  const { jobs, truncated } = await fetchCountyJobs(countyDb);

  const count = jobs.length;
  const medianWage = median(jobs.map((j) => (j.wageMin + j.wageMax) / 2));
  const role = topRole(jobs, loc);

  const intro =
    count === 0
      ? t(`county.${county}.intro_empty`)
      : medianWage === null
        ? t(`county.${county}.intro_template_no_median`, { count, topRole: role })
        : t(`county.${county}.intro_template`, {
            count,
            median: fmtMoney(medianWage, loc),
            topRole: role,
          });

  const faq = [1, 2, 3].map((i) => ({
    question: t(`county.${county}.faq.q${i}`),
    answer: t(`county.${county}.faq.a${i}`),
  }));

  const base = getSiteUrl();
  const shown = jobs.slice(0, DISPLAY_LIMIT);
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: shown.map((j, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${base}/${locale}/jobs/${j.seoSlug}`,
      name: loc === 'es' ? j.titleEs : j.titleEn,
    })),
  };
  const crumbs = breadcrumbJsonLd({
    locale: loc,
    trail: [
      { name: t('county.breadcrumb.jobs'), path: '/jobs' },
      { name: t(`county.${county}.h1`), path: `/jobs/county/${county}` },
    ],
  });
  const faqLd = faqPageJsonLd({ locale: loc, entries: faq });

  const siblings = SERVICE_COUNTIES.filter((s) => s !== county);

  return (
    <PublicShell locale={locale} title={t(`county.${county}.h1`)} maxWidth="lg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([crumbs, itemListJsonLd, faqLd]) }}
      />

      <p className="text-base-content/80 mt-3 max-w-2xl text-[15.5px] leading-relaxed tabular-nums slashed-zero">
        {intro}
      </p>

      {count > 0 && (
        <div className="border-base-300 mt-6 flex flex-wrap gap-x-10 gap-y-3 border-y py-4">
          <Stat label={loc === 'es' ? 'Trabajos abiertos' : 'Open jobs'}>
            {truncated ? `${count}+` : String(count)}
          </Stat>
          {medianWage !== null && (
            <Stat label={loc === 'es' ? 'Salario mediano' : 'Median wage'}>
              {fmtMoney(medianWage, loc)}
            </Stat>
          )}
        </div>
      )}

      {count === 0 ? null : (
        <div className="mt-8 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {shown.map((j) => (
            <PublicJobCard key={j.id} job={j} locale={locale} />
          ))}
        </div>
      )}

      {(count > DISPLAY_LIMIT || truncated) && (
        <div className="mt-6">
          <Link
            href={`/${locale}/jobs?county=${countyDb}`}
            className="border-base-300 inline-block rounded-full border bg-white px-5 py-2.5 text-[13px] font-semibold no-underline"
          >
            {loc === 'es'
              ? `Ver todos los trabajos en el ${t(`footer.counties.${county}`)}`
              : `See all jobs in ${t(`footer.counties.${county}`)}`}
          </Link>
        </div>
      )}

      <section className="border-base-300 bg-base-200 mt-10 rounded-2xl border p-6">
        <p className="text-base-content/80 m-0 text-[14.5px] leading-relaxed">
          {t(`county.${county}.context_crops`)}{' '}
          {t(`county.${county}.context_seasons`)}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl font-semibold tracking-[-0.02em]">
          {loc === 'es' ? 'Preguntas frecuentes' : 'Common questions'}
        </h2>
        <dl className="mt-4 space-y-5">
          {faq.map((f) => (
            <div key={f.question} className="border-base-300 border-b pb-5 last:border-0">
              <dt className="text-[15.5px] font-semibold">{f.question}</dt>
              <dd className="text-base-content/75 m-0 mt-1.5 text-[14.5px] leading-relaxed">
                {f.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <nav className="border-base-300 mt-10 border-t pt-6" aria-label={t('county.nav.siblings_label')}>
        <p className="text-base-content/60 m-0 text-[12px] font-semibold uppercase tracking-wide">
          {t('county.nav.siblings_label')}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {siblings.map((s) => (
            <Link
              key={s}
              href={`/${locale}/jobs/county/${s}`}
              className="border-base-300 rounded-full border bg-white px-4 py-2 text-[13px] font-medium no-underline"
            >
              {t(`footer.counties.${s}`)}
            </Link>
          ))}
          <Link
            href={`/${locale}/jobs`}
            className="bg-base-content text-base-100 rounded-full px-4 py-2 text-[13px] font-medium no-underline"
          >
            {t('county.nav.all')}
          </Link>
        </div>
      </nav>
    </PublicShell>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-base-content font-serif text-[26px] font-normal leading-none tabular-nums slashed-zero">
        {children}
      </div>
      <div className="text-base-content/60 mt-1 text-[12px]">{label}</div>
    </div>
  );
}
