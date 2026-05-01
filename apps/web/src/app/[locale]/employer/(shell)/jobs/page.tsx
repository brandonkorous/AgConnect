import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { listEmployerJobs } from '@/lib/api/employer';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.jobs.list' });
  return { title: `AgConn — ${t('title')}` };
}

export default async function EmployerJobsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.jobs.list' });
  const jobs = await listEmployerJobs();

  const counts = {
    all: jobs.length,
    active: jobs.filter((j) => j.status === 'active').length,
    drafts: jobs.filter((j) => j.status === 'draft').length,
    filled: jobs.filter((j) => j.status === 'filled').length,
    closed: jobs.filter((j) => j.status === 'closed').length,
  };

  return (
    <div className="px-8 pb-16 pt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
            postings
          </p>
          <h1 className="font-display mt-1 text-4xl font-light leading-tight tracking-tight">
            {t('title')}
          </h1>
        </div>
        <Link href={`/${locale}/employer/jobs/new`} className="btn btn-primary">
          <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
          {t('new_posting')}
        </Link>
      </div>

      <div className="border-base-300 mb-6 flex flex-wrap gap-2 border-b pb-3">
        {(['all', 'active', 'drafts', 'filled', 'closed'] as const).map((tab, i) => (
          <button
            key={tab}
            type="button"
            className={[
              'rounded-full border px-3 py-1.5 text-xs font-semibold',
              i === 0
                ? 'bg-base-content text-base-100 border-base-content'
                : 'bg-base-100 border-base-300 text-base-content/70',
            ].join(' ')}
          >
            {t(`tabs.${tab}`)}{' '}
            <span className="opacity-70 font-mono">{counts[tab]}</span>
          </button>
        ))}
      </div>

      {jobs.length === 0 ? (
        <div className="bg-base-100 border-base-300 rounded-2xl border p-12 text-center">
          <p className="text-base-content/70">{t('empty')}</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {jobs.map((j) => (
            <article
              key={j.id}
              className="bg-base-100 border-base-300 rounded-2xl border p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">
                    {locale === 'es' ? j.titleEs : j.titleEn}
                  </h3>
                  <p className="text-base-content/60 mt-0.5 text-xs">
                    {j.county}
                    {j.city ? ` · ${j.city}` : ''} · ${j.wageMin}–${j.wageMax}/hr
                  </p>
                </div>
                <span
                  className={[
                    'rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase',
                    statusToneClass(j.status),
                  ].join(' ')}
                >
                  {j.status}
                </span>
              </div>

              <div className="border-base-300 mb-3 grid grid-cols-2 gap-3 border-b border-t border-dashed py-3">
                <div>
                  <div className="text-base-content/60 font-mono text-[10px] uppercase tracking-wider">
                    Crew
                  </div>
                  <div className="text-sm font-semibold">
                    {j.hireCount}/{j.positionsTotal}
                  </div>
                  <div className="bg-base-200 mt-1 h-1.5 overflow-hidden rounded-full">
                    <div
                      className={[
                        'h-full',
                        j.hireCount >= j.positionsTotal ? 'bg-success' : 'bg-primary',
                      ].join(' ')}
                      style={{ width: `${(j.hireCount / j.positionsTotal) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-base-content/60 font-mono text-[10px] uppercase tracking-wider">
                    Applicants
                  </div>
                  <div className="text-sm font-semibold">
                    {j.applicationCounts.applied + j.applicationCounts.reviewed + j.applicationCounts.hired}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Link
                  href={`/${locale}/employer/jobs/${j.id}`}
                  className="btn btn-ghost btn-sm border-base-300 border"
                >
                  {t('edit')}
                </Link>
                <Link
                  href={`/${locale}/employer/jobs/${j.id}/applicants`}
                  className="btn btn-sm btn-neutral"
                >
                  {t('review')} →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function statusToneClass(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-success/15 text-success';
    case 'filled':
      return 'bg-info/15 text-info';
    case 'closed':
    case 'draft':
    default:
      return 'bg-base-200 text-base-content/60';
  }
}
