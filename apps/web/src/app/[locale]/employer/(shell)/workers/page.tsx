import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLock,
  faFilter,
  faMagnifyingGlass,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import {
  getEmployerProfile,
  searchWorkers,
  listEmployerJobs,
  type WorkerCardView,
} from '@/lib/api/employer';
import { InviteWorkerButton } from '@/components/employer/workers/InviteWorkerButton';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ county?: string; q?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.workers' });
  return { title: `AgConn — ${t('title')}` };
}

const COUNTIES = ['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare'] as const;

export default async function WorkersSearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'employer.workers' });
  const profile = await getEmployerProfile();
  const isProPlus = profile?.plan === 'pro' || profile?.plan === 'enterprise';

  if (!isProPlus) {
    return (
      <div className="px-5 md:px-8 lg:px-20 pb-16 pt-8">
        <div className="bg-base-100 border-base-300 rounded-2xl border p-10 text-center">
            <div className="bg-primary/10 text-primary mx-auto grid h-14 w-14 place-items-center rounded-full">
              <FontAwesomeIcon icon={faLock} className="h-6 w-6" />
            </div>
            <h1 className="font-display mt-5 text-3xl font-light tracking-tight">
              {t('plan_gate.title')}
            </h1>
            <p className="text-base-content/70 mx-auto mt-3 max-w-md text-sm">
              {t('plan_gate.body')}
            </p>
            <Link href={`/${locale}/employer/billing`} className="btn btn-primary mt-6">
              {t('plan_gate.upgrade')}
            </Link>
          </div>
      </div>
    );
  }

  const [workers, jobs] = await Promise.all([
    searchWorkers({ county: sp.county, q: sp.q }),
    listEmployerJobs(),
  ]);
  const activeJobs = jobs.filter((j) => j.status === 'active');

  return (
    <div className="px-5 md:px-8 lg:px-20 pb-16 pt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
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
            defaultValue={sp.q ?? ''}
            placeholder={t('search_placeholder')}
            className="bg-transparent text-xs outline-none w-44"
          />
        </label>
        <Link
          href={`/${locale}/employer/workers`}
          className={[
            'rounded-full border px-3 py-1.5 text-xs font-semibold',
            !sp.county
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
              sp.county === c
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
        <div className="grid gap-3 md:grid-cols-2">
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

function WorkerCard({
  w,
  locale,
  t,
  jobs,
}: {
  w: WorkerCardView;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations>>;
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
          <div className="text-base-content/60 mt-0.5 text-[11px]">
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
          className="border-base-300 rounded-full border bg-transparent px-3 py-1.5 text-[11px] font-semibold"
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

function MatchScore({
  pct,
  t,
}: {
  pct: number;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
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
