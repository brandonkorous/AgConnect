'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';
import {
  PipelineCounters,
  type PipelineCounts,
} from '@/components/worker/applications/PipelineCounters';
import {
  ActiveApplicationsTable,
  type ActiveAppRow,
} from '@/components/worker/applications/ActiveApplicationsTable';
import {
  ArchiveTable,
  type ArchiveAppRow,
} from '@/components/worker/applications/ArchiveTable';
import { useApplicationsSuspense } from '@/lib/api/hooks/applications';
import { inferCrop } from '@/lib/crop';
import { SkeletonApplicationsPanel } from '@/components/ui/skeleton/domain';

function ApplicationsInner() {
  const locale = useLocale();
  const t = useTranslations('worker.applications_dense');
  const { data: page } = useApplicationsSuspense('all');
  const applications = page.applications;

  const counts: PipelineCounts = {
    applied: applications.filter((a) => a.status === 'applied').length,
    reviewed: applications.filter((a) => a.status === 'reviewed').length,
    hired: applications.filter((a) => a.status === 'hired').length,
    withdrawn: applications.filter(
      (a) => a.status === 'withdrawn' || a.status === 'rejected',
    ).length,
  };

  const active: ActiveAppRow[] = applications
    .filter(
      (a) => a.status === 'applied' || a.status === 'reviewed' || a.status === 'hired',
    )
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
    .map((a) => ({
      id: a.id,
      status: a.status as 'applied' | 'reviewed' | 'hired',
      jobSlug: a.job.seoSlug,
      jobTitleEn: a.job.titleEn,
      jobTitleEs: a.job.titleEs,
      employerName: a.job.employerName,
      startDate: a.job.startDate,
      pay: `$${a.job.wageMin.toFixed(2)}`,
      appliedOn: a.appliedAt.slice(0, 10),
      spots: null,
      crop: inferCrop(a.job.titleEn, a.skillsAtApply),
    }));

  const archive: ArchiveAppRow[] = applications
    .filter((a) => a.status === 'rejected' || a.status === 'withdrawn')
    .map((a) => ({
      id: a.id,
      crop: inferCrop(a.job.titleEn, a.skillsAtApply),
      jobTitleEn: a.job.titleEn,
      jobTitleEs: a.job.titleEs,
      employerName: a.job.employerName,
      date: (a.withdrawnAt ?? a.rejectedAt ?? a.appliedAt).slice(0, 10),
      result: a.status === 'rejected' ? 'not_selected' : 'withdrawn',
      earned: null,
    }));

  return (
    <div className=" px-5 pb-16 pt-8">
      <WorkerPageHeader
        eyebrow={t('eyebrow_n', {
          active: counts.applied + counts.reviewed,
          waiting: counts.applied,
        })}
        title={
          <>
            {t('title.lead')}{' '}
            <em className="text-primary font-light italic">{t('title.em')}</em>.
          </>
        }
        sub={t('sub')}
        right={
          <Link
            href={`/${locale}/worker/jobs`}
            className="btn btn-primary btn-sm rounded-full"
          >
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
            {t('cta_more')}
          </Link>
        }
      />
      <PipelineCounters counts={counts} />
      <ActiveApplicationsTable rows={active} locale={locale} />
      <ArchiveTable rows={archive} locale={locale} />
    </div>
  );
}

export function ApplicationsClient() {
  return (
    <Suspense fallback={<SkeletonApplicationsPanel />}>
      <ApplicationsInner />
    </Suspense>
  );
}
