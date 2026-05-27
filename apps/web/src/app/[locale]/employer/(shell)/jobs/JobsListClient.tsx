'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { faSeedling } from '@fortawesome/free-solid-svg-icons';
import { useEmployerJobsSuspense } from '@/lib/api/hooks/employer';
import { EmptyStateCard } from '@/components/employer/primitives';
import {
  JobCard,
  JobsFilterRow,
  JobsHeader,
  type FilterKey,
  type SortKey,
  SORT_KEYS,
  normalizeFilter,
  normalizeSort,
  filterJobs,
  sortJobs,
  pickDuplicateSource,
  shortDate,
  durationLabel,
  totalApplicants,
  computeCounts,
  statusLabel,
  buildCardStrings,
  buildHref,
} from '@/components/employer/jobs-list';
import { SkeletonCard } from '@/components/ui/skeleton';

function JobsListInner() {
  const locale = useLocale();
  const sp = useSearchParams();
  const q = (sp.get('q') ?? '').trim();
  const activeFilter = normalizeFilter(sp.get('filter') ?? undefined);
  const activeSort = normalizeSort(sp.get('sort') ?? undefined);
  const t = useTranslations('employer.jobs.list');
  const tHead = useTranslations('employer.jobs.list_head');
  const { data: allJobs } = useEmployerJobsSuspense();

  const counts = computeCounts(allJobs);
  const visibleJobs = sortJobs(filterJobs(allJobs, activeFilter, q), activeSort);
  const lastSourceJob = pickDuplicateSource(allJobs);

  const filters = (['all', 'open', 'urgent', 'filled', 'drafts', 'closed'] as const).map((key) => ({
    key,
    n: counts[key],
    active: key === activeFilter,
    label: tHead(`tab.${key}`),
  }));

  const sortConfig = {
    active: activeSort,
    entries: SORT_KEYS.map((key) => ({ key, label: tHead(`sort.${key}`) })),
  };

  const totalsLine = tHead('summary', {
    open: counts.open,
    spots: allJobs
      .filter((j) => j.status === 'active' || j.status === 'draft')
      .reduce((sum, j) => sum + (j.positionsTotal - j.hireCount), 0),
    applicants: allJobs.reduce(
      (s, j) => s + j.applicationCounts.applied + j.applicationCounts.reviewed,
      0,
    ),
  });

  const baseHref = `/${locale}/employer/jobs`;
  const chipHref = (filter: FilterKey) =>
    buildHref(baseHref, {
      filter: filter === 'all' ? '' : filter,
      q,
      sort: activeSort === 'urgent' ? '' : activeSort,
    });
  const sortHref = (sort: SortKey) =>
    buildHref(baseHref, {
      filter: activeFilter === 'all' ? '' : activeFilter,
      q,
      sort: sort === 'urgent' ? '' : sort,
    });

  const cardStrings = buildCardStrings(t, tHead);

  return (
    <div className=" px-5 pb-16 pt-8">
      <JobsHeader
        eyebrow={tHead('eyebrow')}
        titleA={tHead('title_a')}
        titleB={tHead('title_b')}
        summary={totalsLine}
        duplicateHref={
          lastSourceJob ? `/${locale}/employer/jobs/new?from=${lastSourceJob.id}` : null
        }
        duplicateLabel={tHead('duplicate')}
        duplicateEmptyTitle={tHead('duplicate_empty')}
        newHref={`/${locale}/employer/jobs/new`}
        newLabel={t('new_posting')}
      />

      <JobsFilterRow
        filters={filters}
        sort={sortConfig}
        chipHref={chipHref}
        sortHref={sortHref}
      />

      {q && (
        <div className="text-base-content/70 mb-4 text-sm">
          {tHead('q_summary', { q, n: visibleJobs.length })}{' '}
          <Link href={`/${locale}/employer/jobs`} className="link link-hover text-primary">
            {tHead('clear_search')}
          </Link>
        </div>
      )}

      {allJobs.length === 0 ? (
        <EmptyStateCard
          icon={faSeedling}
          title={tHead('empty_title')}
          description={t('empty')}
          cta={{ label: t('new_posting'), href: `/${locale}/employer/jobs/new` }}
        />
      ) : visibleJobs.length === 0 ? (
        <div className="bg-base-100 border-base-300 rounded-2xl border p-12 text-center">
          <p className="text-base-content/70">{q ? tHead('no_results') : t('empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-4">
          {visibleJobs.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              locale={locale}
              startsLabel={shortDate(j.startDate, locale)}
              durationLabel={durationLabel(j, locale)}
              strings={{
                ...cardStrings,
                statusLabel: statusLabel(j, tHead),
                reviewLabel: tHead('review_n', { n: totalApplicants(j) }),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function JobsListClient() {
  return (
    <Suspense fallback={<SkeletonCard rows={6} />}>
      <JobsListInner />
    </Suspense>
  );
}
