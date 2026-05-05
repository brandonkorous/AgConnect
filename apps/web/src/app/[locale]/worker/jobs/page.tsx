import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { BrowseJobsHeader } from '@/components/jobs/BrowseJobsHeader';
import { BrowseJobsFilters } from '@/components/jobs/BrowseJobsFilters';
import { CropChips } from '@/components/jobs/CropChips';
import { BrowseJobsAside } from '@/components/jobs/BrowseJobsAside';
import { JobCard, type JobCardData } from '@/components/jobs/JobCard';
import { LoadMoreButton } from '@/components/jobs/LoadMoreButton';
import { fetchJobs, type JobsQuery } from '@/lib/api/jobs';
import { fetchSavedSearches } from '@/lib/api/saved-searches';
import { inferCrop } from '@/lib/crop';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.jobs' });
  return { title: t('title') };
}

const COUNTY = 'Madera, CA';

const PAGE_SIZE = 16;

function asString(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function asArray(v: string | string[] | undefined): string[] | undefined {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === 'string' && v.trim().length > 0) {
    return v.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return undefined;
}

function buildQuery(sp: Record<string, string | string[] | undefined>): JobsQuery {
  const housing = asString(sp.housing);
  const transport = asString(sp.transport);
  const wageMin = asString(sp.wageMin);
  return {
    q: asString(sp.q),
    county: asArray(sp.county),
    skills: asArray(sp.skills),
    wageMin: wageMin ? Number(wageMin) : undefined,
    startBefore: asString(sp.startBefore),
    startAfter: asString(sp.startAfter),
    housing: housing === '1' || housing === 'true' ? true : undefined,
    transport: transport === '1' || transport === 'true' ? true : undefined,
    cursor: asString(sp.cursor) ?? null,
    limit: PAGE_SIZE,
  };
}

const enrich = (jobs: JobCardData[]): JobCardData[] =>
  jobs.map((j, i) => ({
    ...j,
    crop: inferCrop(j.titleEn, j.skills),
    badge:
      j.employerVerified && i % 3 === 1
        ? 'Hiring fast'
        : j.employerVerified
          ? 'Verified'
          : undefined,
    spots: 6 + ((i * 7) % 18),
  }));

export default async function JobsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'worker.jobs.browse' });
  const query = buildQuery(sp);
  const [{ jobs: rawJobs, nextCursor }, savedSearches] = await Promise.all([
    fetchJobs(query),
    fetchSavedSearches(),
  ]);
  const noExperience = asString(sp.noExperience) === '1';
  const filteredRaw = noExperience
    ? rawJobs.filter((j) => j.skills.length <= 1)
    : rawJobs;
  const jobs = enrich(filteredRaw as unknown as JobCardData[]);

  return (
    <div className="min-w-0 max-w-full px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
      <BrowseJobsHeader totalCount={jobs.length} county={COUNTY} locale={locale} />
      <BrowseJobsFilters />
      <CropChips />

      <div className="grid min-w-0 grid-cols-1 gap-[22px] lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3.5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-[22px] font-normal tracking-[-0.02em]">
                {t('top_matches')}
              </h2>
              <div className="text-base-content/60 mt-0.5 text-[12.5px]">
                {t('updated')}
              </div>
            </div>
            <span className="text-base-content/60 text-xs">
              {t.rich('showing', {
                total: jobs.length,
                strong: (chunks) => (
                  <strong className="text-base-content">{chunks}</strong>
                ),
              })}
            </span>
          </div>
          {jobs.length === 0 ? (
            <div className="border-base-300 grid gap-3 rounded-2xl border bg-white p-10 text-center">
              <p className="text-base-content/80 text-[14px] font-semibold">
                {t('empty_title')}
              </p>
              <p className="text-base-content/60 text-[13px]">{t('empty_body')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} locale={locale} />
              ))}
            </div>
          )}
          {nextCursor && (
            <div className="mt-6 flex justify-center">
              <LoadMoreButton cursor={nextCursor} pageSize={PAGE_SIZE} />
            </div>
          )}
        </div>

        <BrowseJobsAside locale={locale} savedSearches={savedSearches} />
      </div>
    </div>
  );
}
