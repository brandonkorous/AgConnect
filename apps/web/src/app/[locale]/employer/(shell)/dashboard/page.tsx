import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBriefcase,
  faUsers,
  faSeedling,
  faHandshake,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import {
  getEmployerProfile,
  getDashboardStats,
  listEmployerJobs,
  listInbox,
} from '@/lib/api/employer';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.dashboard' });
  return { title: `AgConn — ${t('kpi.active_postings')}` };
}

export default async function EmployerDashboardPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.dashboard' });
  const tList = await getTranslations({ locale, namespace: 'employer.jobs.list' });
  const profile = await getEmployerProfile();
  const stats = await getDashboardStats();
  const jobs = await listEmployerJobs();
  const inbox = await listInbox();

  const greeting = greetingKey();
  const firstName = profile?.displayName.split(' ')[0] ?? '';

  return (
    <div className="px-8 pb-16 pt-8">
      <div className="mb-8">
        <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
          {profile?.county ?? '—'}
        </p>
        <h1 className="font-display mt-1 text-4xl font-light leading-tight tracking-tight">
          {t(greeting)}, <em className="text-primary not-italic">{firstName}</em>
        </h1>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={faBriefcase} label={t('kpi.active_postings')} value={stats.activePostings} />
        <Kpi icon={faUsers} label={t('kpi.applicants_week')} value={stats.applicantsThisWeek} />
        <Kpi icon={faSeedling} label={t('kpi.open_seats')} value={stats.openSeats} />
        <Kpi icon={faHandshake} label={t('kpi.hired_season')} value={stats.hiredThisSeason} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <section className="bg-base-100 border-base-300 rounded-2xl border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('recent_postings')}</h2>
            <Link
              href={`/${locale}/employer/jobs`}
              className="text-primary inline-flex items-center gap-1 text-sm font-medium"
            >
              {t('view_all')}
              <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {jobs.slice(0, 3).map((j) => (
              <Link
                key={j.id}
                href={`/${locale}/employer/jobs/${j.id}/applicants`}
                className="border-base-300 hover:bg-base-200 flex items-center gap-3 rounded-xl border p-4 transition-colors"
              >
                <div className="bg-base-200 grid h-10 w-10 place-items-center rounded-lg">
                  <FontAwesomeIcon icon={faBriefcase} className="text-base-content/70 h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {locale === 'es' ? j.titleEs : j.titleEn}
                  </div>
                  <div className="text-base-content/60 text-xs">
                    {j.county} · ${j.wageMin}–${j.wageMax}/hr · {j.hireCount}/{j.positionsTotal}
                  </div>
                </div>
                <span
                  className={[
                    'rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase',
                    statusToneClass(j.status),
                  ].join(' ')}
                >
                  {j.status}
                </span>
                <div className="text-base-content/70 text-xs font-semibold">
                  {tList('applicants', { count: j.applicationCounts.applied })}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-base-100 border-base-300 rounded-2xl border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('recent_applicants')}</h2>
            <Link
              href={`/${locale}/employer/inbox`}
              className="text-primary inline-flex items-center gap-1 text-sm font-medium"
            >
              {t('view_all')}
              <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {inbox.slice(0, 4).map((a) => (
              <Link
                key={a.id}
                href={`/${locale}/employer/applications/${a.id}`}
                className="border-base-300 hover:bg-base-200 flex items-center gap-3 rounded-xl border p-3 transition-colors"
              >
                <div className="bg-primary text-primary-content grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold">
                  {a.worker.firstName[0]}
                  {a.worker.lastInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {a.worker.firstName} {a.worker.lastInitial}.
                  </div>
                  <div className="text-base-content/60 truncate text-xs">
                    {locale === 'es' ? a.job.titleEs : a.job.titleEn} · {a.worker.county}
                  </div>
                </div>
                <div className="text-base-content/60 font-mono text-[11px]">
                  {a.worker.skillsMatchCount} match
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
}: {
  icon: typeof faBriefcase;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-base-100 border-base-300 rounded-2xl border p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="bg-primary/10 text-primary grid h-8 w-8 place-items-center rounded-lg">
          <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="font-display text-3xl font-light leading-none">{value}</div>
      <div className="text-base-content/60 mt-1 text-xs font-medium">{label}</div>
    </div>
  );
}

function greetingKey(): 'greeting_morning' | 'greeting_afternoon' | 'greeting_evening' {
  const h = new Date().getHours();
  if (h < 12) return 'greeting_morning';
  if (h < 17) return 'greeting_afternoon';
  return 'greeting_evening';
}

function statusToneClass(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-success/15 text-success';
    case 'filled':
      return 'bg-info/15 text-info';
    case 'closed':
      return 'bg-base-200 text-base-content/60';
    case 'draft':
    default:
      return 'bg-base-200 text-base-content/60';
  }
}
