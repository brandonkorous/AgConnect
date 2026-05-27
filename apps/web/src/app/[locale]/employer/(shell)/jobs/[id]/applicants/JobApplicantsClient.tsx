'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import {
  useEmployerJobSuspense,
  useEmployerInboxSuspense,
} from '@/lib/api/hooks/employer';
import {
  ApplicantKanban,
  type KanbanLaneInput,
  type KanbanLaneKey,
} from '@/components/employer/applications/ApplicantKanban';
import { SkeletonCard } from '@/components/ui/skeleton';

const LANE_KEYS: KanbanLaneKey[] = ['applied', 'reviewed', 'hired', 'rejected'];

function JobApplicantsInner({ id }: { id: string }) {
  const locale = useLocale();
  const tKan = useTranslations('employer.kanban');
  const tForm = useTranslations('employer.jobs.form');
  const tDash = useTranslations('employer.dashboard.pipeline');
  const { data: job } = useEmployerJobSuspense(id);
  const { data: apps } = useEmployerInboxSuspense();
  if (!job) notFound();
  const forJob = apps.filter((a) => a.job.id === id);

  const title = locale === 'es' ? job.titleEs : job.titleEn;
  const wageLabel = formatWage(job.wageMin, job.wageMax, locale);
  const eyebrowParts = [title.toUpperCase()];
  if (job.humanId) eyebrowParts.push(`#${job.humanId}`);
  const eyebrow = eyebrowParts.join(' · ');

  const lanes: KanbanLaneInput[] = LANE_KEYS.map((key) => ({
    key,
    label: tKan(key),
    emptyCopy: tKan('empty_stage'),
    cards: forJob
      .filter((a) => a.status === key)
      .map((a) => ({
        id: a.id,
        firstName: a.worker.firstName,
        lastInitial: a.worker.lastInitial,
        appliedAt: a.appliedAt,
        href: `/${locale}/employer/applications/${a.id}`,
        status: key,
        matchLabel:
          a.worker.skillsMatchCount > 0
            ? `${a.worker.skillsMatchCount} ${tDash('match')}`
            : undefined,
      })),
  }));

  return (
    <div className=" px-5 pb-16 pt-8">
      <div className="mb-6">
        <Link
          href={`/${locale}/employer/jobs`}
          className="text-base-content/60 hover:text-base-content inline-flex items-center text-sm"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="mr-2 h-3 w-3" />
          {tForm('back')}
        </Link>
        <div className="text-base-content/55 mt-3 font-mono text-xs font-bold uppercase tracking-wider">
          {eyebrow}
        </div>
        <h1 className="font-display mt-1.5 text-4xl font-light leading-tight tracking-tight md:text-5xl">
          {tKan('applied')} <em className="text-primary font-light italic">{title}</em>
        </h1>
        <p className="text-base-content/60 mt-2 text-sm">
          {job.county}
          {wageLabel ? ` · ${wageLabel}` : ''}
          {' · '}
          {job.hireCount}/{job.positionsTotal}
        </p>
      </div>

      <ApplicantKanban locale={locale} lanes={lanes} jobTitle={title} />
    </div>
  );
}

function formatWage(min: number, max: number, locale: string): string {
  if (!(min > 0) && !(max > 0)) {
    return locale === 'es' ? 'Sueldo por confirmar' : 'Wage TBD';
  }
  if (min === max) return `$${min}/hr`;
  return `$${min}–$${max}/hr`;
}

export function JobApplicantsClient({ id }: { id: string }) {
  return (
    <Suspense fallback={<SkeletonCard rows={6} />}>
      <JobApplicantsInner id={id} />
    </Suspense>
  );
}
