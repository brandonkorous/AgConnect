'use client';

import { useState } from 'react';
import { WorkerJobCard } from './WorkerJobCard';
import type { RecommendedJob } from '@/lib/api/hooks/jobs';

type FilterKey = 'all' | 'within_25' | 'this_week' | 'pays_22';

type Labels = {
  all: string;
  within25: string;
  thisWeek: string;
  pays22: string;
  empty: string;
};

type Props = {
  jobs: RecommendedJob[];
  locale: string;
  labels: Labels;
};

function applyFilter(jobs: RecommendedJob[], key: FilterKey): RecommendedJob[] {
  if (key === 'all') return jobs;
  if (key === 'pays_22') {
    return jobs.filter((j) => j.wageUnit === 'hour' && j.wageMin >= 22);
  }
  if (key === 'this_week') {
    const now = Date.now();
    const weekFromNow = now + 7 * 86_400_000;
    return jobs.filter((j) => {
      const t = new Date(j.startDate).getTime();
      return t >= now - 86_400_000 && t <= weekFromNow;
    });
  }
  // within_25 — county-only proxy until we have geo radius. Worker county
  // would come from profile; we keep all jobs whose county matches the
  // first job (heuristic) so the pill is visibly different from "all".
  if (key === 'within_25') {
    const county = jobs[0]?.county;
    return county ? jobs.filter((j) => j.county === county) : jobs;
  }
  return jobs;
}

export function MatchedJobsClient({ jobs, locale, labels }: Props) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const filtered = applyFilter(jobs, filter);

  const pills: { key: FilterKey; label: string }[] = [
    { key: 'all', label: labels.all },
    { key: 'within_25', label: labels.within25 },
    { key: 'this_week', label: labels.thisWeek },
    { key: 'pays_22', label: labels.pays22 },
  ];

  return (
    <>
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {pills.map(({ key, label }) => {
          const isActive = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={[
                'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                isActive
                  ? 'bg-neutral text-neutral-content'
                  : 'bg-base-100 text-base-content/70 border-base-300 hover:bg-base-200 border',
              ].join(' ')}
            >
              {label}
            </button>
          );
        })}
      </div>
      {filtered.length === 0 ? (
        <div className="border-base-300 bg-base-100 rounded-2xl border p-6 text-center">
          <p className="text-base-content/70 text-sm">{labels.empty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {filtered.slice(0, 4).map((job) => (
            <WorkerJobCard key={job.id} job={job} locale={locale} />
          ))}
        </div>
      )}
    </>
  );
}
