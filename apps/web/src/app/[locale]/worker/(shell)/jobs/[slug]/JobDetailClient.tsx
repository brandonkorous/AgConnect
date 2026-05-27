'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faLocationDot,
  faCalendarDays,
  faHouse,
  faVanShuttle,
  faShareNodes,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { Pill } from '@/components/worker/primitives/Pill';
import { CropGlyph } from '@/components/jobs/CropGlyph';
import { ApplyButton } from '@/components/jobs/ApplyButton';
import { useJobSuspense, type JobDetail } from '@/lib/api/hooks/jobs';
import { useProfileSuspense } from '@/lib/api/hooks/profile';
import { inferCrop } from '@/lib/crop';
import { getSmsApplyNumber, getSmsApplyKeyword } from '@/lib/sms-apply';
import { SkeletonCard } from '@/components/ui/skeleton';

function countWorkingDays(mask: number): number {
  let count = 0;
  for (let i = 0; i < 7; i++) if ((mask >> i) & 1) count++;
  return count;
}

function DetailsGrid({ job, locale }: { job: JobDetail; locale: string }) {
  const t = useTranslations('worker.job_detail.details');
  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(iso));

  const items: { label: string; value: string }[] = [];
  if (job.dailyStartTime && job.dailyEndTime) {
    items.push({
      label: t('schedule'),
      value: `${job.dailyStartTime}–${job.dailyEndTime}`,
    });
  }
  const dayCount = countWorkingDays(job.workingDays);
  if (dayCount > 0) items.push({ label: t('days_per_week'), value: `${dayCount}` });
  if (job.endDate) items.push({ label: t('runs_until'), value: fmtDate(job.endDate) });
  if (job.positionsTotal > 1) {
    const open = Math.max(0, job.positionsTotal - job.hireCount);
    items.push({
      label: t('positions'),
      value: t('positions_value', { open, total: job.positionsTotal }),
    });
  }
  if (job.payFrequency) {
    items.push({ label: t('pay_frequency'), value: t(`pay_frequency.${job.payFrequency}`) });
  }
  if (job.mealsProvided) items.push({ label: t('extras'), value: t('meals_provided') });
  if (job.pickupPoint) items.push({ label: t('pickup_point'), value: job.pickupPoint });

  if (items.length === 0) return null;

  return (
    <div className="border-base-300 bg-base-100 mt-4 grid grid-cols-1 gap-3 rounded-2xl border p-5 sm:grid-cols-2">
      {items.map((it) => (
        <div key={it.label}>
          <div className="text-base-content/60 font-mono text-xs font-semibold uppercase tracking-[0.18em]">
            {it.label}
          </div>
          <div className="text-base-content mt-1 text-[14.5px] font-medium">{it.value}</div>
        </div>
      ))}
    </div>
  );
}

function JobGoneView() {
  const locale = useLocale();
  const t = useTranslations('worker.job_detail');
  const tPublic = useTranslations('public_jobs.detail');
  return (
    <div className="px-6 pb-16 pt-8 lg:px-8">
      <Link
        href={`/${locale}/worker/jobs`}
        className="text-base-content/70 hover:text-base-content mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
        {t('back')}
      </Link>
      <div className="mx-auto max-w-prose py-12 text-center">
        <h1 className="font-serif text-[32px] tracking-[-0.025em] sm:text-[40px]">
          {tPublic('closed_heading')}
        </h1>
        <p className="text-base-content/70 mt-4 text-[14.5px] leading-relaxed">
          {tPublic('closed_body')}
        </p>
        <Link
          href={`/${locale}/worker/jobs`}
          className="btn btn-primary mt-6 no-underline"
        >
          {tPublic('closed_cta')}
        </Link>
      </div>
    </div>
  );
}

function JobDetailInner({ slug }: { slug: string }) {
  const locale = useLocale();
  const t = useTranslations('worker.job_detail');
  const { data: result } = useJobSuspense(slug);
  const { data: profile } = useProfileSuspense();

  if (result.status === 'gone') return <JobGoneView />;

  const job = result.data;
  const title = locale === 'es' ? job.titleEs : job.titleEn;
  const description = locale === 'es' ? job.descriptionEs : job.descriptionEn;
  const crop = inferCrop(job.titleEn, job.skills);

  return (
    <div className="px-6 pb-16 pt-8 lg:px-8">
      <Link
        href={`/${locale}/worker/jobs`}
        className="text-base-content/70 hover:text-base-content mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
        {t('back')}
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="flex items-start gap-4">
            <div className="bg-base-200 grid h-14 w-14 shrink-0 place-items-center rounded-2xl">
              <CropGlyph crop={crop} size={32} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {job.employerVerified && (
                  <Pill tone="primary">
                    <FontAwesomeIcon icon={faCircleCheck} className="h-2.5 w-2.5" />
                    {t('verified')}
                  </Pill>
                )}
                <span className="text-base-content/60 text-[12px]">{job.employerName}</span>
              </div>
              <h1 className="font-serif mt-1.5 text-[32px] font-normal leading-tight tracking-[-0.025em] sm:text-[40px]">
                {title}
              </h1>
              <div className="text-base-content/70 mt-2 flex flex-wrap items-center gap-3 text-[13.5px]">
                <span className="inline-flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" />
                  {job.city ? `${job.city}, ${job.county}` : `${job.county} County`}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCalendarDays} className="h-3 w-3" />
                  {t('starts_on', {
                    date: new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                      timeZone: 'UTC',
                    }).format(new Date(job.startDate)),
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="border-base-300 bg-base-100 mt-6 grid gap-1 rounded-2xl border p-5">
            <div className="text-base-content/60 font-mono text-xs font-semibold uppercase tracking-[0.18em]">
              {t('wage_label')}
            </div>
            <div className="font-serif text-primary text-[40px] leading-none tracking-[-0.025em]">
              ${job.wageMin}–${job.wageMax}
            </div>
            <div className="text-base-content/60 mt-1 text-[12px]">/{job.wageUnit}</div>
          </div>

          <DetailsGrid job={job} locale={locale} />

          <div className="mt-6">
            <h2 className="font-serif mb-3 text-[20px] tracking-[-0.02em]">{t('about')}</h2>
            <p className="text-base-content/80 whitespace-pre-line text-[14.5px] leading-relaxed">
              {description || t('no_description')}
            </p>
          </div>

          {job.skills.length > 0 && (
            <div className="mt-6">
              <h2 className="font-serif mb-3 text-[20px] tracking-[-0.02em]">{t('skills')}</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((s) => (
                  <span
                    key={s}
                    className="bg-base-200 text-base-content/80 rounded-full px-3 py-1 text-[12px]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {job.housing && (
              <span className="border-base-300 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px]">
                <FontAwesomeIcon icon={faHouse} className="h-3 w-3" />
                {t('housing')}
              </span>
            )}
            {job.transport && (
              <span className="border-base-300 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px]">
                <FontAwesomeIcon icon={faVanShuttle} className="h-3 w-3" />
                {t('transport')}
              </span>
            )}
          </div>

          <div className="border-base-300 mt-8 border-t pt-5">
            <h3 className="text-base-content/70 mb-2.5 text-[13px] font-semibold">
              {t('share_title')}
            </h3>
            <div className="flex flex-wrap gap-2">
              <a
                href={`sms:?&body=${encodeURIComponent(
                  t('share_body_with_county', {
                    title,
                    wageMin: job.wageMin,
                    wageMax: job.wageMax,
                    wageUnit: job.wageUnit,
                    county: job.county,
                  }),
                )}`}
                className="border-base-300 inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-2 text-[12px] font-semibold"
              >
                <FontAwesomeIcon icon={faShareNodes} className="h-3 w-3" />
                SMS
              </a>
            </div>
          </div>
        </div>

        <aside className="grid gap-3.5 self-start">
          <div className="border-base-300 bg-base-100 grid gap-3 rounded-2xl border p-5">
            <ApplyButton
              jobId={job.id}
              locale={locale}
              alreadyAppliedStatus={job.applicationStatus ?? null}
              applyWith={{
                name:
                  [profile.firstName, profile.lastName].filter(Boolean).join(' ') || null,
                county: profile.county,
                skills: profile.skills,
                phone: profile.phone,
              }}
            />
            {getSmsApplyNumber() && (
              <div className="text-base-content/60 text-center text-[11.5px]">
                {t('apply_via_sms', {
                  keyword: getSmsApplyKeyword(),
                  number: getSmsApplyNumber()!,
                })}
              </div>
            )}
          </div>
          <div className="border-base-300 bg-base-100 grid gap-1 rounded-2xl border p-5">
            <div className="text-base-content/60 font-mono text-xs font-semibold uppercase tracking-[0.18em]">
              {t('apply_by_label')}
            </div>
            <div className="font-serif text-[24px] tracking-[-0.025em]">
              {job.applyBy
                ? new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'UTC',
                  }).format(new Date(job.applyBy))
                : t('apply_by_open')}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function JobDetailClient({ slug }: { slug: string }) {
  return (
    <Suspense fallback={<SkeletonCard rows={8} />}>
      <JobDetailInner slug={slug} />
    </Suspense>
  );
}
