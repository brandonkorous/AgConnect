import type { Metadata, Route } from 'next';
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

type FilterKey = 'all' | 'open' | 'urgent' | 'filled' | 'drafts' | 'closed';
type SortKey = 'urgent' | 'newest' | 'starts_soon';

type Props = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ q?: string; filter?: string; sort?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.jobs.list' });
    return { title: `AgConn — ${t('title')}` };
}

export default async function EmployerJobsPage({ params, searchParams }: Props) {
    const { locale } = await params;
    const sp = await searchParams;
    const q = (sp.q ?? '').trim();
    const activeFilter = normalizeFilter(sp.filter);
    const activeSort = normalizeSort(sp.sort);
    const t = await getTranslations({ locale, namespace: 'employer.jobs.list' });
    const tHead = await getTranslations({ locale, namespace: 'employer.jobs.list_head' });
    const allJobs = await listEmployerJobs();

    const counts = {
        all: allJobs.length,
        open: allJobs.filter((j) => j.status === 'active').length,
        urgent: allJobs.filter(
            (j) => j.status === 'active' && j.positionsTotal - j.hireCount >= Math.ceil(j.positionsTotal / 2),
        ).length,
        filled: allJobs.filter((j) => j.status === 'filled').length,
        drafts: allJobs.filter((j) => j.status === 'draft').length,
        closed: allJobs.filter((j) => j.status === 'closed').length,
    };

    const visibleJobs = sortJobs(filterJobs(allJobs, activeFilter, q), activeSort);
    const lastSourceJob = pickDuplicateSource(allJobs);

    const filters: Array<{ key: FilterKey; n: number; active: boolean }> = (
        ['all', 'open', 'urgent', 'filled', 'drafts', 'closed'] as const
    ).map((key) => ({ key, n: counts[key], active: key === activeFilter }));

    const totalsLine = tHead('summary', {
        open: counts.open,
        spots: allJobs
            .filter((j) => j.status === 'active' || j.status === 'draft')
            .reduce((sum, j) => sum + (j.positionsTotal - j.hireCount), 0),
        applicants: allJobs.reduce(
            (s, j) => s + j.applicationCounts.applied + j.applicationCounts.reviewed,
            0,
        ),
    });

    function chipHref(filter: FilterKey): string {
        const usp = new URLSearchParams();
        if (filter !== 'all') usp.set('filter', filter);
        if (q) usp.set('q', q);
        if (activeSort !== 'urgent') usp.set('sort', activeSort);
        const qs = usp.toString();
        return qs ? `/${locale}/employer/jobs?${qs}` : `/${locale}/employer/jobs`;
    }

    function sortHref(sort: SortKey): string {
        const usp = new URLSearchParams();
        if (activeFilter !== 'all') usp.set('filter', activeFilter);
        if (q) usp.set('q', q);
        if (sort !== 'urgent') usp.set('sort', sort);
        const qs = usp.toString();
        return qs ? `/${locale}/employer/jobs?${qs}` : `/${locale}/employer/jobs`;
    }

    return (
        <div className="px-5 pb-16 pt-8">
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
                    {lastSourceJob ? (
                        <Link
                            href={`/${locale}/employer/jobs/new?from=${lastSourceJob.id}`}
                            className="btn btn-sm bg-base-100 border-base-300 rounded-full border font-medium"
                        >
                            <FontAwesomeIcon icon={faCopy} className="h-3 w-3" />
                            {tHead('duplicate')}
                        </Link>
                    ) : (
                        <button
                            type="button"
                            disabled
                            title={tHead('duplicate_empty')}
                            className="btn btn-sm bg-base-100 border-base-300 rounded-full border font-medium"
                        >
                            <FontAwesomeIcon icon={faCopy} className="h-3 w-3" />
                            {tHead('duplicate')}
                        </button>
                    )}
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
                    <Link
                        key={f.key}
                        href={chipHref(f.key) as Route}
                        scroll={false}
                        aria-current={f.active ? 'page' : undefined}
                        className={[
                            'rounded-full border px-3 py-1.5 text-xs font-semibold',
                            f.active
                                ? 'bg-base-content text-base-100 border-base-content'
                                : 'bg-base-100 border-base-300 text-base-content/70 hover:bg-base-200',
                        ].join(' ')}
                    >
                        {tHead(`tab.${f.key}`)} <span className="opacity-70 font-mono">{f.n}</span>
                    </Link>
                ))}
                <div className="flex-1" />
                <details className="dropdown dropdown-end">
                    <summary className="bg-base-100 border-base-300 inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold">
                        <FontAwesomeIcon icon={faFilter} className="h-2.5 w-2.5" />
                        {tHead(`sort.${activeSort}`)}
                    </summary>
                    <ul className="dropdown-content menu bg-base-100 border-base-300 rounded-box z-10 mt-2 w-44 border p-2 text-xs shadow-md">
                        {(['urgent', 'newest', 'starts_soon'] as const).map((s) => (
                            <li key={s}>
                                <Link href={sortHref(s) as Route} scroll={false} aria-current={s === activeSort ? 'page' : undefined}>
                                    {tHead(`sort.${s}`)}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </details>
            </div>

            {q && (
                <div className="text-base-content/70 mb-4 text-sm">
                    {tHead('q_summary', { q, n: visibleJobs.length })}{' '}
                    <Link href={`/${locale}/employer/jobs`} className="link link-hover text-primary">
                        {tHead('clear_search')}
                    </Link>
                </div>
            )}

            {visibleJobs.length === 0 ? (
                <div className="bg-base-100 border-base-300 rounded-2xl border p-12 text-center">
                    <p className="text-base-content/70">{q ? tHead('no_results') : t('empty')}</p>
                </div>
            ) : (
                <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
                    {visibleJobs.map((j) => (
                        <JobCard key={j.id} job={j} locale={locale} t={t} tHead={tHead} />
                    ))}
                </div>
            )}

            {allJobs.length > 0 && (
                <div className="border-base-300 bg-base-200/40 mt-8 grid grid-cols-[1fr_auto] items-center gap-6 rounded-2xl border border-dashed p-6">
                    <div>
                        <h2 className="font-display text-xl font-light tracking-tight">
                            {tHead('templates_title')}
                        </h2>
                        <p className="text-base-content/70 mt-1 text-sm">{tHead('templates_body')}</p>
                    </div>
                    <details className="dropdown dropdown-end">
                        <summary className="bg-base-content text-base-100 inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold">
                            <FontAwesomeIcon icon={faCopy} className="h-3 w-3" />
                            {tHead('templates_cta')}
                        </summary>
                        <ul className="dropdown-content menu bg-base-100 border-base-300 rounded-box z-10 mt-2 w-72 border p-2 text-xs shadow-md">
                            {allJobs.slice(0, 8).map((j) => (
                                <li key={j.id}>
                                    <Link
                                        href={`/${locale}/employer/jobs/new?from=${j.id}`}
                                        className="flex items-center justify-between gap-2"
                                    >
                                        <span className="truncate">{locale === 'es' ? j.titleEs : j.titleEn}</span>
                                        <span className="text-base-content/50 font-mono text-[10px] uppercase">
                                            {j.county}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </details>
                </div>
            )}
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
                <details className="dropdown dropdown-end">
                    <summary
                        aria-label={tHead('actions.label')}
                        className="text-base-content/50 hover:text-base-content list-none cursor-pointer rounded p-1"
                    >
                        <FontAwesomeIcon icon={faEllipsisVertical} className="h-3.5 w-3.5" />
                    </summary>
                    <ul className="dropdown-content menu bg-base-100 border-base-300 rounded-box z-10 mt-2 w-44 border p-2 text-xs shadow-md">
                        <li>
                            <Link href={`/${locale}/employer/jobs/${job.id}`}>
                                {tHead('actions.edit')}
                            </Link>
                        </li>
                        <li>
                            <Link href={`/${locale}/employer/jobs/${job.id}/applicants`}>
                                {tHead('actions.applicants')}
                            </Link>
                        </li>
                        <li>
                            <Link href={`/${locale}/employer/jobs/new?from=${job.id}`}>
                                {tHead('actions.duplicate')}
                            </Link>
                        </li>
                    </ul>
                </details>
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

function normalizeFilter(raw: string | undefined): FilterKey {
    const allowed: readonly FilterKey[] = ['all', 'open', 'urgent', 'filled', 'drafts', 'closed'];
    return allowed.includes(raw as FilterKey) ? (raw as FilterKey) : 'all';
}

function normalizeSort(raw: string | undefined): SortKey {
    const allowed: readonly SortKey[] = ['urgent', 'newest', 'starts_soon'];
    return allowed.includes(raw as SortKey) ? (raw as SortKey) : 'urgent';
}

function filterJobs(
    jobs: EmployerJobView[],
    filter: FilterKey,
    q: string,
): EmployerJobView[] {
    let out = jobs;
    if (filter === 'open') out = out.filter((j) => j.status === 'active');
    else if (filter === 'filled') out = out.filter((j) => j.status === 'filled');
    else if (filter === 'drafts') out = out.filter((j) => j.status === 'draft');
    else if (filter === 'closed') out = out.filter((j) => j.status === 'closed');
    else if (filter === 'urgent') {
        out = out.filter(
            (j) =>
                j.status === 'active' &&
                j.positionsTotal - j.hireCount >= Math.ceil(j.positionsTotal / 2),
        );
    }
    if (q) {
        const needle = q.toLowerCase();
        out = out.filter(
            (j) =>
                j.titleEn.toLowerCase().includes(needle) ||
                j.titleEs.toLowerCase().includes(needle) ||
                j.county.toLowerCase().includes(needle) ||
                (j.city ?? '').toLowerCase().includes(needle),
        );
    }
    return out;
}

function sortJobs(jobs: EmployerJobView[], sort: SortKey): EmployerJobView[] {
    const out = [...jobs];
    if (sort === 'urgent') {
        out.sort((a, b) => urgencyScore(b) - urgencyScore(a));
    } else if (sort === 'newest') {
        out.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    } else if (sort === 'starts_soon') {
        out.sort((a, b) => a.startDate.localeCompare(b.startDate));
    }
    return out;
}

function pickDuplicateSource(jobs: EmployerJobView[]): EmployerJobView | null {
    if (jobs.length === 0) return null;
    const ranked = [...jobs].sort((a, b) => {
        const rank = (j: EmployerJobView) =>
            j.status === 'active'
                ? 3
                : j.status === 'filled'
                    ? 2
                    : j.status === 'closed'
                        ? 1
                        : 0;
        if (rank(b) !== rank(a)) return rank(b) - rank(a);
        return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
    });
    return ranked[0] ?? null;
}

function urgencyScore(j: EmployerJobView): number {
    if (j.status !== 'active') return -1;
    const open = j.positionsTotal - j.hireCount;
    if (open <= 0) return 0;
    return open / Math.max(1, j.positionsTotal);
}

function shortDate(iso: string, locale: string): string {
    // Parse as a local calendar date — `new Date('2026-05-15')` is UTC midnight,
    // which formats one day earlier in any negative-UTC zone (e.g. PT).
    const [y = 0, m = 1, d = 1] = iso.split('-').map(Number);
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    }).format(new Date(y, m - 1, d));
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
