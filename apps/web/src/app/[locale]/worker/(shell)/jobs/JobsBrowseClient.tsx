'use client';

import { Suspense } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { BrowseJobsHeader } from '@/components/jobs/BrowseJobsHeader';
import { BrowseJobsFilters } from '@/components/jobs/BrowseJobsFilters';
import { CropChips } from '@/components/jobs/CropChips';
import { BrowseJobsAside } from '@/components/jobs/BrowseJobsAside';
import { JobCard, type JobCardData } from '@/components/jobs/JobCard';
import { LoadMoreButton } from '@/components/jobs/LoadMoreButton';
import { useProfileSuspense } from '@/lib/api/hooks/profile';
import { useJobsSuspense, type JobsQuery } from '@/lib/api/hooks/jobs';
import { useSavedSearchesSuspense } from '@/lib/api/hooks/saved-searches';
import { inferCrop } from '@/lib/crop';
import { SkeletonMatchedJobs } from '@/components/ui/skeleton/domain/SkeletonMatchedJobs';

const PAGE_SIZE = 16;
const SORT_OPTIONS = ['best', 'newest', 'wage_high', 'starts_soon'] as const;

function asString(v: string | null): string | undefined {
  return v ?? undefined;
}
function asArray(v: string | null): string[] | undefined {
  if (!v) return undefined;
  const trimmed = v.trim();
  if (trimmed.length === 0) return undefined;
  return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
}

function buildQuery(
  sp: URLSearchParams,
  workerCounty: string,
): JobsQuery {
  const housing = asString(sp.get('housing'));
  const transport = asString(sp.get('transport'));
  const wageMin = asString(sp.get('wageMin'));
  const sort = asString(sp.get('sort'));
  const myCounty = asString(sp.get('myCounty'));
  const counties = asArray(sp.get('county')) ?? (myCounty === '1' ? [workerCounty] : undefined);
  return {
    q: asString(sp.get('q')),
    county: counties,
    skills: asArray(sp.get('skills')),
    wageMin: wageMin ? Number(wageMin) : undefined,
    startBefore: asString(sp.get('startBefore')),
    startAfter: asString(sp.get('startAfter')),
    housing: housing === '1' || housing === 'true' ? true : undefined,
    transport: transport === '1' || transport === 'true' ? true : undefined,
    sort: (SORT_OPTIONS as readonly string[]).includes(sort ?? '')
      ? (sort as JobsQuery['sort'])
      : undefined,
    cursor: asString(sp.get('cursor')) ?? null,
    limit: PAGE_SIZE,
  };
}

const enrich = (jobs: JobCardData[]): JobCardData[] =>
  jobs.map((j) => ({
    ...j,
    crop: inferCrop(j.titleEn, j.skills),
    badge: j.employerVerified ? 'Verified' : undefined,
  }));

export function JobsBrowseClient() {
  return (
    <div className="container mx-auto min-w-0 max-w-full px-5 pb-16 pt-6 md:px-8 lg:px-20">
      <Suspense fallback={<JobsBrowseSkeleton />}>
        <JobsBrowseInner />
      </Suspense>
    </div>
  );
}

function JobsBrowseInner() {
  const locale = useLocale();
  const t = useTranslations('worker.jobs.browse');
  const sp = useSearchParams();
  const { data: profile } = useProfileSuspense();
  const workerCounty = profile.county ?? 'Madera';
  const params = new URLSearchParams(sp?.toString() ?? '');
  const query = buildQuery(params, workerCounty);
  const { data: jobsPage } = useJobsSuspense(query);
  const { data: savedSearches } = useSavedSearchesSuspense();
  const { jobs: rawJobs, nextCursor, totalCount, cropCounts } = jobsPage;
  const noExperience = asString(sp?.get('noExperience') ?? null) === '1';
  const filteredRaw = noExperience
    ? rawJobs.filter((j) => j.skills.length <= 1)
    : rawJobs;
  const jobs = enrich(filteredRaw as unknown as JobCardData[]);
  const totalShown = jobs.length;

  return (
    <>
      <BrowseJobsHeader
        totalCount={totalCount}
        county={`${workerCounty}, CA`}
        locale={locale}
      />
      <BrowseJobsFilters workerCounty={profile.county ?? null} />
      <CropChips counts={cropCounts} />
      <div className="grid min-w-0 grid-cols-1 gap-[22px] lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3.5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-[22px] font-normal tracking-[-0.02em]">
                {t('top_matches')}
              </h2>
              <div className="text-base-content/60 mt-0.5 text-sm">{t('updated')}</div>
            </div>
            <span className="text-base-content/60 text-xs">
              {t.rich('showing', {
                shown: totalShown,
                total: totalCount,
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
    </>
  );
}

function JobsBrowseSkeleton() {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-[22px] lg:grid-cols-[1.5fr_1fr]">
      <SkeletonMatchedJobs />
      <div className="bg-base-100 border-base-300 rounded-2xl border h-[420px] animate-pulse motion-reduce:animate-none" />
    </div>
  );
}
