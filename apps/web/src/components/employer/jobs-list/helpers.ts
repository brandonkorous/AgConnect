import type { useTranslations } from 'next-intl';
import type { EmployerJobView } from '@/lib/api/hooks/employer';
import type { FilterKey, SortKey } from './JobsFilterRow';

type Translator = ReturnType<typeof useTranslations>;

export const FILTER_KEYS: readonly FilterKey[] = [
    'all',
    'open',
    'urgent',
    'filled',
    'drafts',
    'closed',
] as const;

export const SORT_KEYS: readonly SortKey[] = ['urgent', 'newest', 'starts_soon'] as const;

export function normalizeFilter(raw: string | undefined): FilterKey {
    return FILTER_KEYS.includes(raw as FilterKey) ? (raw as FilterKey) : 'all';
}

export function normalizeSort(raw: string | undefined): SortKey {
    return SORT_KEYS.includes(raw as SortKey) ? (raw as SortKey) : 'urgent';
}

export function filterJobs(
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

export function sortJobs(jobs: EmployerJobView[], sort: SortKey): EmployerJobView[] {
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

export function pickDuplicateSource(jobs: EmployerJobView[]): EmployerJobView | null {
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

export function shortDate(iso: string, locale: string): string {
    const [y = 0, m = 1, d = 1] = iso.split('-').map(Number);
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    }).format(new Date(y, m - 1, d));
}

export function totalApplicants(j: EmployerJobView): number {
    return j.applicationCounts.applied + j.applicationCounts.reviewed + j.applicationCounts.hired;
}

export function computeCounts(jobs: EmployerJobView[]): Record<FilterKey, number> {
    return {
        all: jobs.length,
        open: jobs.filter((j) => j.status === 'active').length,
        urgent: jobs.filter(
            (j) =>
                j.status === 'active' &&
                j.positionsTotal - j.hireCount >= Math.ceil(j.positionsTotal / 2),
        ).length,
        filled: jobs.filter((j) => j.status === 'filled').length,
        drafts: jobs.filter((j) => j.status === 'draft').length,
        closed: jobs.filter((j) => j.status === 'closed').length,
    };
}

export function statusLabel(job: EmployerJobView, tHead: Translator): string {
    const open = job.positionsTotal - job.hireCount;
    if (job.status === 'filled' || open === 0) return tHead('status.filled');
    if (job.status === 'closed') return tHead('status.closed');
    if (job.status === 'draft') return tHead('status.draft');
    return tHead('status.spots_open', { n: open });
}

export function buildCardStrings(t: Translator, tHead: Translator) {
    return {
        edit: t('edit'),
        starts: tHead('starts'),
        crew: tHead('crew'),
        confirmed: tHead('confirmed'),
        applicantsShort: tHead('applicants_short'),
        newShort: tHead('new_short'),
        actionLabels: {
            label: tHead('actions.label'),
            edit: tHead('actions.edit'),
            applicants: tHead('actions.applicants'),
            duplicate: tHead('actions.duplicate'),
            close: tHead('actions.close'),
            discard: tHead('actions.discard'),
            pauseRenotify: tHead('actions.pause_renotify'),
            resumeRenotify: tHead('actions.resume_renotify'),
            confirmDiscardTitle: tHead('confirm_discard.title'),
            confirmDiscardBody: tHead('confirm_discard.body'),
            confirmCloseTitle: tHead('confirm_close.title'),
            confirmCloseBody: tHead('confirm_close.body'),
            cancel: tHead('confirm_cancel'),
            confirmDiscard: tHead('confirm_discard.cta'),
            confirmClose: tHead('confirm_close.cta'),
        },
    };
}

export function buildHref(
    base: string,
    params: { filter?: string; q?: string; sort?: string },
): string {
    const usp = new URLSearchParams();
    if (params.filter) usp.set('filter', params.filter);
    if (params.q) usp.set('q', params.q);
    if (params.sort) usp.set('sort', params.sort);
    const qs = usp.toString();
    return qs ? `${base}?${qs}` : base;
}

export function durationLabel(job: EmployerJobView, locale: string): string {
    if (!job.endDate) return locale === 'es' ? 'continuo' : 'ongoing';
    const days = Math.max(
        1,
        Math.round(
            (new Date(job.endDate).getTime() - new Date(job.startDate).getTime()) /
                (24 * 60 * 60 * 1000),
        ),
    );
    return `${days}d`;
}
