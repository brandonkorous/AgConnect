'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter,
  faMagnifyingGlass,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import {
  useEmployerProfileSuspense,
  useSearchWorkersSuspense,
  useEmployerJobsSuspense,
  verificationStatus,
  type WorkerCardView,
} from '@/lib/api/hooks/employer';
import { InviteWorkerButton } from '@/components/employer/workers/InviteWorkerButton';
import { LockedCard } from '@/components/employer/primitives';
import { SkeletonCard } from '@/components/ui/skeleton';

const COUNTIES = ['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare'] as const;

function WorkersInner() {
  const locale = useLocale();
  const sp = useSearchParams();
  const county = sp.get('county') ?? undefined;
  const q = sp.get('q') ?? undefined;
  const t = useTranslations('employer.workers');

  const { data: profile } = useEmployerProfileSuspense();
  const isProPlus = profile?.plan === 'pro' || profile?.plan === 'enterprise';

  if (!isProPlus) {
    const vStatus = profile ? verificationStatus(profile) : 'pending';
    const verificationPending = vStatus === 'pending' || vStatus === 'rejected';
    return (
      <div className=" px-5 pb-16 pt-8">
        <div className="mb-6">
          <p className="text-base-content/60 font-mono text-xs uppercase tracking-wider">
            {t('eyebrow')}
          </p>
          <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
            {t('title_a')}{' '}
            <em className="text-primary not-italic font-light">{t('title_b', { count: 0 })}</em>
          </h1>
        </div>
        <LockedCard
          title={t('plan_gate.title')}
          description={t('plan_gate.body')}
          cta={{ label: t('plan_gate.upgrade'), href: `/${locale}/employer/billing` }}
          hint={verificationPending ? t('plan_gate.verification_hint') : undefined}
        />
      </div>
    );
  }

  return (
    <Suspense fallback={<SkeletonCard rows={6} />}>
      <WorkersList locale={locale} county={county} q={q} t={t} />
    </Suspense>
  );
}

function WorkersList({
  locale,
  county,
  q,
  t,
}: {
  locale: string;
  county?: string;
  q?: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const { data: workers } = useSearchWorkersSuspense({ county, q });
  const { data: jobs } = useEmployerJobsSuspense();
  const activeJobs = jobs.filter((j) => j.status === 'active');

  return (
    <div className=" px-5 pb-16 pt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-base-content/60 font-mono text-xs uppercase tracking-wider">
            {t('eyebrow')}
          </p>
          <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
            {t('title_a')}{' '}
            <em className="text-primary not-italic font-light">
              {t('title_b', { count: workers.length })}
            </em>
          </h1>
          <p className="text-base-content/70 mt-2 max-w-2xl text-sm">{t('subtitle')}</p>
        </div>
      </div>

      <form
        method="GET"
        className="border-base-300 mb-5 flex flex-wrap items-center gap-2 border-b pb-4"
      >
        <label className="bg-base-100 border-base-300 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-base-content/50 h-3 w-3" />
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder={t('search_placeholder')}
            className="bg-transparent text-xs outline-none w-44"
          />
        </label>
        <Link
          href={`/${locale}/employer/workers`}
          className={[
            'rounded-full border px-3 py-1.5 text-xs font-semibold',
            !county
              ? 'bg-base-content text-base-100 border-base-content'
              : 'bg-base-100 border-base-300',
          ].join(' ')}
        >
          {t('filter.all_counties')}{' '}
          <span className="opacity-70 font-mono">{workers.length}</span>
        </Link>
        {COUNTIES.map((c) => (
          <Link
            key={c}
            href={`/${locale}/employer/workers?county=${encodeURIComponent(c)}`}
            className={[
              'rounded-full border px-3 py-1.5 text-xs font-semibold',
              county === c
                ? 'bg-base-content text-base-100 border-base-content'
                : 'bg-base-100 border-base-300',
            ].join(' ')}
          >
            {c}
          </Link>
        ))}
        <div className="flex-1" />
        <button
          type="submit"
          className="bg-base-100 border-base-300 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
        >
          <FontAwesomeIcon icon={faFilter} className="h-2.5 w-2.5" />
          {t('filters')}
        </button>
      </form>

      <div className="text-base-content/70 mb-4 text-sm">
        {t('results', { count: workers.length })}
      </div>

      {workers.length === 0 ? (
        <div className="bg-base-100 border-base-300 rounded-2xl border p-12 text-center">
          <p className="text-base-content/70 text-sm">{t('empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {workers.map((w) => (
            <WorkerCard
              key={w.id}
              w={w}
              locale={locale}
              t={t}
              jobs={activeJobs.map((j) => ({ id: j.id, titleEn: j.titleEn, titleEs: j.titleEs }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type TFn = ReturnType<typeof useTranslations>;

function WorkerCard({
  w,
  locale,
  t,
  jobs,
}: {
  w: WorkerCardView;
  locale: string;
  t: TFn;
  jobs: { id: string; titleEn: string; titleEs: string }[];
}) {
  return (
    <article className="bg-base-100 border-base-300 rounded-2xl border p-5">
      <div className="flex items-start gap-3">
        <div className="bg-base-content text-base-100 grid h-11 w-11 shrink-0 place-items-center rounded-full font-mono text-xs font-bold">
          {(w.firstName[0] ?? '').toUpperCase()}
          {w.lastInitial.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-base font-semibold">
              {w.firstName} {w.lastInitial}.
            </div>
            <MatchScore pct={w.matchScore} t={t} />
          </div>
          <div className="text-base-content/60 mt-0.5 text-xs">
            {w.county ?? '—'} · {t('exp_years', { n: w.experienceCount })}
          </div>
        </div>
      </div>

      <div className="border-base-300 mt-3 flex flex-wrap gap-1.5 border-t border-dashed pt-3">
        {w.skills.slice(0, 4).map((s) => (
          <span
            key={s}
            className="bg-base-200 text-base-content/80 rounded px-2 py-0.5 text-[10px] font-semibold"
          >
            {s}
          </span>
        ))}
        {w.certifications.slice(0, 3).map((c) => (
          <span
            key={c.name}
            className="bg-success/15 text-success inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold"
          >
            <FontAwesomeIcon icon={faCircleCheck} className="h-2 w-2" />
            {c.name}
          </span>
        ))}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Link
          href={`/${locale}/employer/workers/${w.id}`}
          className="border-base-300 rounded-full border bg-transparent px-3 py-1.5 text-xs font-semibold"
        >
          {t('view')}
        </Link>
        <InviteWorkerButton
          workerId={w.id}
          workerFirstName={w.firstName}
          jobs={jobs}
          alreadyInvited={w.relationship === 'invited' || w.relationship === 'hired'}
        />
      </div>
    </article>
  );
}

function MatchScore({ pct, t }: { pct: number; t: TFn }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="grid h-7 w-7 place-items-center rounded-full"
        style={{
          background: `conic-gradient(var(--color-primary) ${pct * 3.6}deg, var(--color-base-200) 0)`,
        }}
      >
        <div className="bg-base-100 text-primary grid h-5 w-5 place-items-center rounded-full font-mono text-[8px] font-bold">
          {pct}
        </div>
      </div>
      <span className="text-base-content/60 text-[10px] font-bold">
        {pct}% {t('match_label')}
      </span>
    </div>
  );
}

export function WorkersClient() {
  return (
    <Suspense fallback={<SkeletonCard rows={6} />}>
      <WorkersInner />
    </Suspense>
  );
}
