import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faBolt } from '@fortawesome/free-solid-svg-icons';
import { listInbox, type ApplicantCardView } from '@/lib/api/employer';
import {
  CandidateRowActions,
  RowCheckbox,
} from '@/components/employer/candidates/RowActions';

type TabKey = 'all' | 'new' | 'reviewed' | 'interview' | 'offer' | 'hired' | 'archived';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; q?: string }>;
};

function matchTab(a: { status: string }, tab: TabKey): boolean {
  if (tab === 'all') return true;
  if (tab === 'new') return a.status === 'applied';
  if (tab === 'reviewed') return a.status === 'reviewed';
  if (tab === 'hired') return a.status === 'hired';
  if (tab === 'archived') return a.status === 'rejected' || a.status === 'withdrawn';
  return false;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.candidates' });
  return { title: `AgConn — ${t('title')}` };
}

const VALID_TABS: ReadonlyArray<TabKey> = [
  'all',
  'new',
  'reviewed',
  'interview',
  'offer',
  'hired',
  'archived',
];

export default async function CandidatesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const tab: TabKey =
    sp.tab && (VALID_TABS as ReadonlyArray<string>).includes(sp.tab) ? (sp.tab as TabKey) : 'all';
  const t = await getTranslations({ locale, namespace: 'employer.candidates' });
  const tStatus = await getTranslations({ locale, namespace: 'employer.kanban' });
  const allApps = await listInbox();
  const apps = allApps.filter((a) => matchTab(a, tab));

  const counts = {
    all: allApps.length,
    new: allApps.filter((a) => a.status === 'applied').length,
    reviewed: allApps.filter((a) => a.status === 'reviewed').length,
    interview: 0,
    offer: 0,
    hired: allApps.filter((a) => a.status === 'hired').length,
    archived: allApps.filter((a) => a.status === 'rejected' || a.status === 'withdrawn').length,
  };

  const tabs: Array<{ key: TabKey; n: number }> = [
    { key: 'all', n: counts.all },
    { key: 'new', n: counts.new },
    { key: 'reviewed', n: counts.reviewed },
    { key: 'interview', n: counts.interview },
    { key: 'offer', n: counts.offer },
    { key: 'hired', n: counts.hired },
    { key: 'archived', n: counts.archived },
  ];

  return (
    <div className="px-8 pb-16 pt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
            {t('eyebrow')}
          </p>
          <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
            {t('title_a')}{' '}
            <em className="text-primary not-italic font-light">
              {t('title_b', { count: counts.all })}
            </em>
          </h1>
          <div className="text-base-content/70 mt-2 text-sm">
            {t('summary', {
              new: counts.new,
              reviewed: counts.reviewed,
              interview: counts.interview,
              hired: counts.hired,
            })}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/${locale}/employer/jobs`}
            className="btn btn-sm bg-base-100 border-base-300 rounded-full border font-medium"
            title={t('filters_help')}
          >
            <FontAwesomeIcon icon={faFilter} className="h-3 w-3" />
            {t('filters')}
          </Link>
          <Link
            href={`/${locale}/employer/messages?folder=broadcasts`}
            className="btn btn-sm btn-primary rounded-full"
          >
            <FontAwesomeIcon icon={faBolt} className="h-3 w-3" />
            {t('bulk_message')}
          </Link>
        </div>
      </div>

      <div className="bg-base-100 border-base-300 mb-5 inline-flex w-fit gap-1 rounded-full border p-1">
        {tabs.map((tabItem) => {
          const isActive = tabItem.key === tab;
          const className = [
            'rounded-full px-3.5 py-1.5 text-xs font-semibold',
            isActive ? 'bg-base-content text-base-100' : 'text-base-content/70',
          ].join(' ');
          if (tabItem.key === 'all') {
            return (
              <Link
                key={tabItem.key}
                href={`/${locale}/employer/inbox`}
                className={className}
              >
                {t(`tab.${tabItem.key}`)}{' '}
                <span className="opacity-60 font-mono">{tabItem.n}</span>
              </Link>
            );
          }
          return (
            <a
              key={tabItem.key}
              href={`/${locale}/employer/inbox?tab=${tabItem.key}`}
              className={className}
            >
              {t(`tab.${tabItem.key}`)}{' '}
              <span className="opacity-60 font-mono">{tabItem.n}</span>
            </a>
          );
        })}
      </div>

      {apps.length === 0 ? (
        <div className="bg-base-100 border-base-300 rounded-2xl border p-12 text-center">
          <p className="text-base-content/70">{t('empty')}</p>
        </div>
      ) : (
        <div className="bg-base-100 border-base-300 overflow-hidden rounded-2xl border">
          <div className="bg-base-200 border-base-300 text-base-content/60 grid grid-cols-[24px_2fr_1.4fr_0.8fr_1.4fr_0.9fr_0.8fr_90px] gap-3 border-b px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-wider">
            <input type="checkbox" className="checkbox checkbox-xs" disabled />
            <span>{t('col.candidate')}</span>
            <span>{t('col.applied_for')}</span>
            <span>{t('col.match')}</span>
            <span>{t('col.skills')}</span>
            <span>{t('col.stage')}</span>
            <span>{t('col.applied')}</span>
            <span className="text-right">{t('col.actions')}</span>
          </div>
          {apps.map((a, i) => (
            <Row
              key={a.id}
              a={a}
              locale={locale}
              t={t}
              tStatus={tStatus}
              border={i < apps.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({
  a,
  locale,
  t,
  tStatus,
  border,
}: {
  a: ApplicantCardView;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations>>;
  tStatus: Awaited<ReturnType<typeof getTranslations>>;
  border: boolean;
}) {
  const matchPct = Math.min(100, Math.round((a.worker.skillsMatchCount / 3) * 100));
  const stageTone =
    a.status === 'applied'
      ? 'bg-base-200 text-base-content/70'
      : a.status === 'reviewed'
        ? 'bg-primary/15 text-primary'
        : a.status === 'hired'
          ? 'bg-success/15 text-success'
          : 'bg-error/15 text-error';

  return (
    <Link
      href={`/${locale}/employer/applications/${a.id}`}
      className={[
        'hover:bg-base-200 grid grid-cols-[24px_2fr_1.4fr_0.8fr_1.4fr_0.9fr_0.8fr_90px] items-center gap-3 px-5 py-3.5 text-sm transition-colors',
        border ? 'border-base-300 border-b' : '',
      ].join(' ')}
    >
      <RowCheckbox />
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="bg-base-content text-base-100 grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-[11px] font-bold">
          {(a.worker.firstName[0] ?? '').toUpperCase()}
          {a.worker.lastInitial.toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="truncate font-semibold">
            {a.worker.firstName} {a.worker.lastInitial}.
          </div>
          <div className="text-base-content/60 truncate text-[11px]">
            {a.worker.county ?? '—'}
          </div>
        </div>
      </div>
      <div className="min-w-0">
        <div className="truncate font-medium">
          {locale === 'es' ? a.job.titleEs : a.job.titleEn}
        </div>
        <div className="text-base-content/60 truncate text-[11px]">
          {a.worker.skills.slice(0, 2).join(' · ')}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <div
          className="grid h-9 w-9 place-items-center rounded-full"
          style={{
            background: `conic-gradient(var(--color-primary) ${matchPct * 3.6}deg, var(--color-base-200) 0)`,
          }}
        >
          <div className="bg-base-100 text-primary grid h-7 w-7 place-items-center rounded-full font-mono text-[10px] font-bold">
            {matchPct}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {a.worker.skills.slice(0, 3).map((s) => (
          <span
            key={s}
            className="bg-base-200 text-base-content/80 rounded px-1.5 py-0.5 text-[10px] font-semibold"
          >
            {s}
          </span>
        ))}
      </div>
      <div>
        <span
          className={[
            'rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
            stageTone,
          ].join(' ')}
        >
          {tStatus(a.status === 'withdrawn' ? 'rejected' : a.status)}
        </span>
      </div>
      <div className="text-base-content/60 text-[11px]">{relTime(a.appliedAt, locale)}</div>
      <CandidateRowActions
        applicationId={a.id}
        messageLabel={t('action.message')}
        hireLabel={t('action.hire')}
      />
    </Link>
  );
}

function relTime(iso: string, locale: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const h = Math.floor(diff / 3_600_000);
  const days = Math.floor(h / 24);
  if (locale === 'es') {
    if (h < 1) return 'ahora';
    if (h < 24) return `hace ${h}h`;
    return `hace ${days}d`;
  }
  if (h < 1) return 'now';
  if (h < 24) return `${h}h ago`;
  return `${days}d ago`;
}
