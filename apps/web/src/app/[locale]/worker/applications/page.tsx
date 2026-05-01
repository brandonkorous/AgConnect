import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
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
import { fetchApplications } from '@/lib/api/applications';
import { inferCrop } from '@/lib/crop';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.applications_dense' });
  return { title: t('meta.title') };
}

export default async function ApplicationsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.applications_dense' });
  const { applications } = await fetchApplications();

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
      (a) =>
        a.status === 'applied' ||
        a.status === 'reviewed' ||
        a.status === 'hired',
    )
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
    <div className="px-8 pb-16 pt-8">
      <WorkerPageHeader
        eyebrow={t('eyebrow_n', {
          active: counts.applied + counts.reviewed,
          waiting: counts.applied,
        })}
        title={
          <>
            {t('title.lead')}{' '}
            <em className="text-primary font-light not-italic">{t('title.em')}</em>
            .
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
