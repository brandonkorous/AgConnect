'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';
import { StatTile } from '@/components/worker/primitives/StatTile';
import { InProgressHero } from '@/components/worker/training/InProgressHero';
import { RecommendedGrid } from '@/components/worker/training/RecommendedGrid';
import { CertificateGrid } from '@/components/worker/training/CertificateGrid';
import { SkeletonCard } from '@/components/ui/skeleton';
import {
  useTrainingProgramsSuspense,
  useEnrollmentsSuspense,
} from '@/lib/api/hooks/training';

function TrainingHubInner({ locale }: { locale: string }) {
  const t = useTranslations('worker.training_hub');
  const { data: programsPage } = useTrainingProgramsSuspense({
    hasCapacity: true,
    limit: 6,
  });
  const { data: enrollments } = useEnrollmentsSuspense('all');
  const programs = programsPage.programs;

  const inProgress = enrollments.find((e) => e.status === 'enrolled');
  const completed = enrollments.filter((e) => e.status === 'completed');
  const recommended = programs
    .filter((p) => !enrollments.some((e) => e.program.id === p.id))
    .slice(0, 4);

  const inProgressCount = enrollments.filter((e) => e.status === 'enrolled').length;
  const totalHours = enrollments.length * 8;
  const stats = [
    {
      label: t('stat.in_progress.label'),
      value: inProgressCount > 0 ? String(inProgressCount) : '—',
      sub: inProgress
        ? (locale === 'es' ? inProgress.program.titleEs : inProgress.program.titleEn)
        : inProgressCount > 0
          ? t('stat.in_progress.sub')
          : '',
    },
    {
      label: t('stat.hours.label'),
      value: totalHours > 0 ? String(totalHours) : '—',
      sub: totalHours > 0 ? t('stat.hours.sub') : '',
    },
    {
      label: t('stat.certs.label'),
      value: String(completed.length),
      sub: completed.length > 0 ? t('stat.certs.sub') : '',
      accent: 'primary' as const,
    },
  ];

  return (
    <div className=" px-5 pb-16 pt-8">
      <WorkerPageHeader
        eyebrow={t('eyebrow_n', { n: programs.length })}
        title={
          <>
            {t('title.lead')}{' '}
            <em className="text-primary font-light italic">{t('title.em')}</em>.
          </>
        }
        sub={t('sub')}
        right={
          <Link
            href={`/${locale}/training`}
            className="btn btn-primary btn-sm rounded-full"
          >
            <FontAwesomeIcon icon={faGraduationCap} className="h-3 w-3" />
            {t('cta_browse')}
          </Link>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatTile key={s.label} {...s} />
        ))}
      </div>

      {inProgress && <InProgressHero enrollment={inProgress} locale={locale} />}
      <RecommendedGrid programs={recommended} locale={locale} />
      <CertificateGrid certs={completed} locale={locale} />
    </div>
  );
}

export function TrainingHubClient({ locale }: { locale: string }) {
  return (
    <Suspense fallback={<SkeletonCard rows={8} />}>
      <TrainingHubInner locale={locale} />
    </Suspense>
  );
}
