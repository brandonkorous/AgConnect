import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faBolt, faXmark } from '@fortawesome/free-solid-svg-icons';
import {
    listInbox,
    listEmployerJobs,
    type ApplicantCardView,
} from '@/lib/api/employer';
import {
    CandidateRowActions,
    RowCheckbox,
} from '@/components/employer/candidates/RowActions';
import { FilterChip } from '@/components/employer/primitives';

type TabKey = 'all' | 'new' | 'reviewed' | 'hired' | 'archived';

type Props = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ tab?: string; q?: string; job?: string; county?: string }>;
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

const VALID_TABS: ReadonlyArray<TabKey> = ['all', 'new', 'reviewed', 'hired', 'archived'];

export default async function CandidatesPage({ params, searchParams }: Props) {
    const { locale } = await params;
    const sp = await searchParams;
    const tab: TabKey =
        sp.tab && (VALID_TABS as ReadonlyArray<string>).includes(sp.tab) ? (sp.tab as TabKey) : 'all';
    const q = (sp.q ?? '').trim();
    const jobFilter = (sp.job ?? '').trim();
    const countyFilter = (sp.county ?? '').trim();
    const t = await getTranslations({ locale, namespace: 'employer.candidates' });
    const tStatus = await getTranslations({ locale, namespace: 'employer.kanban' });
    const [allApps, jobs] = await Promise.all([listInbox(), listEmployerJobs()]);

    const counties = Array.from(new Set(allApps.map((a) => a.worker.county).filter((c): c is string => Boolean(c)))).sort();
    const filtered = allApps.filter((a) => {
        if (!matchTab(a, tab)) return false;
        if (jobFilter && a.job.id !== jobFilter) return false;
        if (countyFilter && a.worker.county !== countyFilter) return false;
        if (q) {
            const needle = q.toLowerCase();
            const hay = `${a.worker.firstName} ${a.worker.lastInitial} ${a.worker.skills.join(' ')}`.toLowerCase();
            if (!hay.includes(needle)) return false;
        }
        return true;
    });
    const apps = filtered;

    const counts = {
        all: allApps.length,
        new: allApps.filter((a) => a.status === 'applied').length,
        reviewed: allApps.filter((a) => a.status === 'reviewed').length,
        hired: allApps.filter((a) => a.status === 'hired').length,
        archived: allApps.filter((a) => a.status === 'rejected' || a.status === 'withdrawn').length,
    };

    const tabs: Array<{ key: TabKey; n: number }> = [
        { key: 'all', n: counts.all },
        { key: 'new', n: counts.new },
        { key: 'reviewed', n: counts.reviewed },
        { key: 'hired', n: counts.hired },
        { key: 'archived', n: counts.archived },
    ];

    const hasActiveFilter = jobFilter || countyFilter || q;
    function buildHref(overrides: Partial<{ tab: TabKey; job: string; county: string; q: string }>): string {
        const usp = new URLSearchParams();
        const merged = {
            tab: overrides.tab ?? tab,
            job: overrides.job ?? jobFilter,
            county: overrides.county ?? countyFilter,
            q: overrides.q ?? q,
        };
        if (merged.tab !== 'all') usp.set('tab', merged.tab);
        if (merged.job) usp.set('job', merged.job);
        if (merged.county) usp.set('county', merged.county);
        if (merged.q) usp.set('q', merged.q);
        const qs = usp.toString();
        return qs ? `/${locale}/employer/inbox?${qs}` : `/${locale}/employer/inbox`;
    }

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
                            {t('title_b', { count: counts.all })}
                        </em>
                    </h1>
                    <div className="text-base-content/70 mt-2 text-sm">
                        {t('summary_v2', {
                            new: counts.new,
                            reviewed: counts.reviewed,
                            hired: counts.hired,
                        })}
                    </div>
                </div>
                <div className="flex gap-2">
                    <details className="dropdown dropdown-end">
                        <summary
                            className={[
                                'btn btn-sm rounded-full border font-medium',
                                hasActiveFilter
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-base-100 border-base-300',
                            ].join(' ')}
                        >
                            <FontAwesomeIcon icon={faFilter} className="h-3 w-3" />
                            {t('filters')}
                            {hasActiveFilter && (
                                <span className="bg-primary text-primary-content ml-1 rounded-full px-1.5 font-mono text-[10px]">
                                    {[jobFilter, countyFilter, q].filter(Boolean).length}
                                </span>
                            )}
                        </summary>
                        <div className="dropdown-content bg-base-100 border-base-300 rounded-box z-10 mt-2 w-72 border p-4 shadow-md">
                            <form className="flex flex-col gap-3 text-xs" method="get">
                                <fieldset className="fieldset">
                                    <legend className="fieldset-legend text-xs">{t('filter.search')}</legend>
                                    <input
                                        type="search"
                                        name="q"
                                        defaultValue={q}
                                        placeholder={t('filter.search_placeholder')}
                                        className="input input-sm input-bordered w-full"
                                    />
                                </fieldset>
                                <fieldset className="fieldset">
                                    <legend className="fieldset-legend text-xs">{t('filter.job')}</legend>
                                    <select name="job" defaultValue={jobFilter} className="select select-sm select-bordered w-full">
                                        <option value="">{t('filter.all_jobs')}</option>
                                        {jobs.map((j) => (
                                            <option key={j.id} value={j.id}>
                                                {locale === 'es' ? j.titleEs : j.titleEn}
                                            </option>
                                        ))}
                                    </select>
                                </fieldset>
                                <fieldset className="fieldset">
                                    <legend className="fieldset-legend text-xs">{t('filter.county')}</legend>
                                    <select name="county" defaultValue={countyFilter} className="select select-sm select-bordered w-full">
                                        <option value="">{t('filter.all_counties')}</option>
                                        {counties.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </fieldset>
                                {tab !== 'all' && <input type="hidden" name="tab" value={tab} />}
                                <div className="mt-1 flex justify-between gap-2">
                                    <Link
                                        href={buildHref({ job: '', county: '', q: '' }) as Route}
                                        className="btn btn-ghost btn-xs"
                                    >
                                        {t('filter.clear')}
                                    </Link>
                                    <button type="submit" className="btn btn-primary btn-xs">
                                        {t('filter.apply')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </details>
                    <Link
                        href={`/${locale}/employer/messages?folder=broadcasts` as Route}
                        className="btn btn-sm btn-primary rounded-full"
                    >
                        <FontAwesomeIcon icon={faBolt} className="h-3 w-3" />
                        {t('bulk_message')}
                    </Link>
                </div>
            </div>

            {hasActiveFilter && (
                <div className="text-base-content/70 mb-4 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono uppercase tracking-wider">{t('filter.active')}</span>
                    {q && (
                        <Link
                            href={buildHref({ q: '' }) as Route}
                            className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold"
                        >
                            {q}
                            <FontAwesomeIcon icon={faXmark} className="h-2 w-2" />
                        </Link>
                    )}
                    {jobFilter && (
                        <Link
                            href={buildHref({ job: '' }) as Route}
                            className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold"
                        >
                            {(() => {
                                const j = jobs.find((x) => x.id === jobFilter);
                                return j ? (locale === 'es' ? j.titleEs : j.titleEn) : jobFilter;
                            })()}
                            <FontAwesomeIcon icon={faXmark} className="h-2 w-2" />
                        </Link>
                    )}
                    {countyFilter && (
                        <Link
                            href={buildHref({ county: '' }) as Route}
                            className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold"
                        >
                            {countyFilter}
                            <FontAwesomeIcon icon={faXmark} className="h-2 w-2" />
                        </Link>
                    )}
                </div>
            )}

            <div className="mb-5 flex flex-wrap gap-1.5">
                {tabs.map((tabItem) => (
                    <FilterChip
                        key={tabItem.key}
                        active={tabItem.key === tab}
                        href={buildHref({ tab: tabItem.key })}
                        count={tabItem.n}
                    >
                        {t(`tab.${tabItem.key}`)}
                    </FilterChip>
                ))}
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
                <div className="bg-base-content text-base-100 grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-xs font-bold">
                    {(a.worker.firstName[0] ?? '').toUpperCase()}
                    {a.worker.lastInitial.toUpperCase()}
                </div>
                <div className="min-w-0">
                    <div className="truncate font-semibold">
                        {a.worker.firstName} {a.worker.lastInitial}.
                    </div>
                    <div className="text-base-content/60 truncate text-xs">
                        {a.worker.county ?? '—'}
                    </div>
                </div>
            </div>
            <div className="min-w-0">
                <div className="truncate font-medium">
                    {locale === 'es' ? a.job.titleEs : a.job.titleEn}
                </div>
                <div className="text-base-content/60 truncate text-xs">
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
            <div className="text-base-content/60 text-xs">{relTime(a.appliedAt, locale)}</div>
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
