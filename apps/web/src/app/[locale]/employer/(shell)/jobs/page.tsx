import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faCopy,
  faSeedling,
  faLocationDot,
  faCoins,
  faEllipsisVertical,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { listEmployerJobs, type EmployerJobView } from '@/lib/api/employer';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.jobs.list' });
  return { title: `AgConn — ${t('title')}` };
}

export default async function EmployerJobsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.jobs.list' });
  const tHead = await getTranslations({ locale, namespace: 'employer.jobs.list_head' });
  const jobs = await listEmployerJobs();

  const counts = {
    all: jobs.length,
    open: jobs.filter((j) => j.status === 'active').length,
    urgent: jobs.filter(
      (j) => j.status === 'active' && j.positionsTotal - j.hireCount >= Math.ceil(j.positionsTotal / 2),
    ).length,
    filled: jobs.filter((j) => j.status === 'filled').length,
    drafts: jobs.filter((j) => j.status === 'draft').length,
    closed: jobs.filter((j) => j.status === 'closed').length,
  };

  const filters: Array<{
    key: 'all' | 'open' | 'urgent' | 'filled' | 'drafts' | 'closed';
    n: number;
    active?: boolean;
  }> = [
    { key: 'all',    n: counts.all,    active: true },
    { key: 'open',   n: counts.open },
    { key: 'urgent', n: counts.urgent },
    { key: 'filled', n: counts.filled },
    { key: 'drafts', n: counts.drafts },
    { key: 'closed', n: counts.closed },
  ];

  const totalsLine = tHead('summary', {
    open: counts.open,
    spots: jobs
      .filter((j) => j.status === 'active' || j.status === 'draft')
      .reduce((sum, j) => sum + (j.positionsTotal - j.hireCount), 0),
    applicants: jobs.reduce((s, j) => s + j.applicationCounts.applied + j.applicationCounts.reviewed, 0),
  });

  return (
    <div className="px-8 pb-16 pt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
            {tHead('eyebrow')}
          </p>
          <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
            {tHead('title_a')} <em className="text-primary not-italic font-light">{tHead('title_b')}</em>
          </h1>
          <div className="text-base-content/70 mt-2 text-sm">{totalsLine}</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-sm bg-base-100 border-base-300 rounded-full border font-medium"
          >
            <FontAwesomeIcon icon={faCopy} className="h-3 w-3" />
            {tHead('duplicate')}
          </button>
          <Link
            href={`/${locale}/employer/jobs/new`}
            className="btn btn-sm btn-primary rounded-full"
          >
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
            {t('new_posting')}
          </Link>
        </div>
      </div>

      <div className="border-base-300 mb-6 flex flex-wrap items-center gap-2 border-b pb-4">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            className={[
              'rounded-full border px-3 py-1.5 text-xs font-semibold',
              f.active
                ? 'bg-base-content text-base-100 border-base-content'
                : 'bg-base-100 border-base-300 text-base-content/70',
            ].join(' ')}
          >
            {tHead(`tab.${f.key}`)} <span className="opacity-70 font-mono">{f.n}</span>
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          className="bg-base-100 border-base-300 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
        >
          <FontAwesomeIcon icon={faFilter} className="h-2.5 w-2.5" />
          {tHead('all_crops')}
        </button>
        <button
          type="button"
          className="bg-base-100 border-base-300 rounded-full border px-3 py-1.5 text-xs font-semibold"
        >
          {tHead('sort_urgent')}
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-base-100 border-base-300 rounded-2xl border p-12 text-center">
          <p className="text-base-content/70">{t('empty')}</p>
        </div>
      ) : (
        <div className="grid gap-3.5 md:grid-cols-2">
          {jobs.map((j) => (
            <JobCard key={j.id} job={j} locale={locale} t={t} tHead={tHead} />
          ))}
        </div>
      )}

      <div className="border-base-300 bg-base-200/40 mt-8 grid grid-cols-[1fr_auto] items-center gap-6 rounded-2xl border border-dashed p-6">
        <div>
          <div className="font-display text-xl font-light tracking-tight">{tHead('templates_title')}</div>
          <div className="text-base-content/70 mt-1 text-sm">{tHead('templates_body')}</div>
        </div>
        <button
          type="button"
          className="bg-base-content text-base-100 inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold"
        >
          <FontAwesomeIcon icon={faCopy} className="h-3 w-3" />
          {tHead('templates_cta')}
        </button>
      </div>
    </div>
  );
}

function JobCard({
  job,
  locale,
  t,
  tHead,
}: {
  job: EmployerJobView;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations>>;
  tHead: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const open = job.positionsTotal - job.hireCount;
  const pct = job.positionsTotal > 0 ? (job.hireCount / job.positionsTotal) * 100 : 0;

  const status =
    job.status === 'filled'
      ? { label: tHead('status.filled'), tone: 'bg-success/15 text-success' }
      : job.status === 'closed'
        ? { label: tHead('status.closed'), tone: 'bg-base-200 text-base-content/60' }
        : job.status === 'draft'
          ? { label: tHead('status.draft'), tone: 'bg-base-200 text-base-content/60' }
          : open === 0
            ? { label: tHead('status.filled'), tone: 'bg-success/15 text-success' }
            : open <= job.positionsTotal / 2
              ? { label: tHead('status.spots_open', { n: open }), tone: 'bg-warning/15 text-warning' }
              : { label: tHead('status.spots_open', { n: open }), tone: 'bg-error/15 text-error' };

  const barColor = pct === 100 ? 'bg-success' : pct > 50 ? 'bg-accent' : 'bg-error';
  const totalApplicants =
    job.applicationCounts.applied + job.applicationCounts.reviewed + job.applicationCounts.hired;

  return (
    <article className="bg-base-100 border-base-300 relative rounded-2xl border p-5">
      <div className="mb-4 flex items-start gap-3.5">
        <div className="bg-base-200 grid h-11 w-11 shrink-0 place-items-center rounded-xl">
          <FontAwesomeIcon icon={faSeedling} className="text-primary h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[17px] font-semibold leading-tight tracking-tight">
              {locale === 'es' ? job.titleEs : job.titleEn}
            </h3>
            <span
              className={[
                'rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
                status.tone,
              ].join(' ')}
            >
              {status.label}
            </span>
          </div>
          <div className="text-base-content/60 mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1">
              <FontAwesomeIcon icon={faLocationDot} className="h-2.5 w-2.5" />
              {job.county}
              {job.city ? ` · ${job.city}` : ''}
            </span>
            <span className="inline-flex items-center gap-1">
              <FontAwesomeIcon icon={faCoins} className="h-2.5 w-2.5" />${job.wageMin}
              {job.wageMax !== job.wageMin ? `–$${job.wageMax}` : ''}/hr
            </span>
          </div>
        </div>
        <button
          type="button"
          aria-label="More actions"
          className="text-base-content/50 hover:text-base-content rounded p-1"
        >
          <FontAwesomeIcon icon={faEllipsisVertical} className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="border-base-300 grid grid-cols-2 gap-2.5 border-y border-dashed py-3">
        <div>
          <div className="text-base-content/60 font-mono text-[10px] font-bold uppercase tracking-wider">
            {tHead('starts')}
          </div>
          <div className="mt-0.5 text-sm font-semibold">{shortDate(job.startDate, locale)}</div>
          <div className="text-base-content/60 text-[11px]">{durationLabel(job, locale)}</div>
        </div>
        <div>
          <div className="text-base-content/60 font-mono text-[10px] font-bold uppercase tracking-wider">
            {tHead('crew')}
          </div>
          <div className="mt-0.5 text-sm font-semibold">
            {job.hireCount}/{job.positionsTotal} {tHead('confirmed')}
          </div>
          <div className="bg-base-200 mt-1 h-1.5 overflow-hidden rounded-full">
            <div className={['h-full', barColor].join(' ')} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between">
        <div className="text-base-content/70 text-xs">
          <strong className="text-primary font-mono">{totalApplicants}</strong>{' '}
          {tHead('applicants_short')} ·{' '}
          <span className="text-accent">
            {job.applicationCounts.applied} {tHead('new_short')}
          </span>
        </div>
        <div className="flex gap-1.5">
          <Link
            href={`/${locale}/employer/jobs/${job.id}`}
            className="border-base-300 rounded-full border bg-transparent px-3 py-1.5 text-[11px] font-semibold"
          >
            {t('edit')}
          </Link>
          <Link
            href={`/${locale}/employer/jobs/${job.id}/applicants`}
            className="bg-base-content text-base-100 rounded-full px-3.5 py-1.5 text-[11px] font-semibold"
          >
            {tHead('review_n', { n: totalApplicants })} →
          </Link>
        </div>
      </div>
    </article>
  );
}

function shortDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}

function durationLabel(job: EmployerJobView, locale: string): string {
  if (!job.endDate) return locale === 'es' ? 'continuo' : 'ongoing';
  const days = Math.max(
    1,
    Math.round(
      (new Date(job.endDate).getTime() - new Date(job.startDate).getTime()) / (24 * 60 * 60 * 1000),
    ),
  );
  return `${days}d`;
}
