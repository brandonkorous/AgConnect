'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Route } from 'next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faChevronDown } from '@fortawesome/free-solid-svg-icons';

type FilterKey =
    | 'my_county'
    | 'this_week'
    | 'pays_22'
    | 'has_housing'
    | 'pickup'
    | 'no_experience';

const FILTER_KEYS: FilterKey[] = [
    'my_county',
    'this_week',
    'pays_22',
    'has_housing',
    'pickup',
    'no_experience',
];

function isOn(sp: URLSearchParams, key: FilterKey): boolean {
    switch (key) {
        case 'my_county':
            return sp.get('myCounty') === '1';
        case 'this_week': {
            const v = sp.get('startBefore');
            return Boolean(v);
        }
        case 'pays_22':
            return Number(sp.get('wageMin') ?? '0') >= 22;
        case 'has_housing':
            return sp.get('housing') === '1';
        case 'pickup':
            return sp.get('transport') === '1';
        case 'no_experience':
            return sp.get('noExperience') === '1';
    }
}

function applyToggle(sp: URLSearchParams, key: FilterKey, on: boolean): URLSearchParams {
    const next = new URLSearchParams(sp);
    next.delete('cursor');
    switch (key) {
        case 'my_county':
            if (on) next.set('myCounty', '1');
            else next.delete('myCounty');
            break;
        case 'this_week':
            if (on) {
                const d = new Date();
                d.setUTCDate(d.getUTCDate() + 7);
                next.set('startBefore', d.toISOString().slice(0, 10));
            } else {
                next.delete('startBefore');
            }
            break;
        case 'pays_22':
            if (on) next.set('wageMin', '22');
            else next.delete('wageMin');
            break;
        case 'has_housing':
            if (on) next.set('housing', '1');
            else next.delete('housing');
            break;
        case 'pickup':
            if (on) next.set('transport', '1');
            else next.delete('transport');
            break;
        case 'no_experience':
            if (on) next.set('noExperience', '1');
            else next.delete('noExperience');
            break;
    }
    return next;
}

type Props = { workerCounty?: string | null };

export function BrowseJobsFilters({ workerCounty }: Props = {}) {
    const t = useTranslations('worker.jobs.browse');
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    function toggle(k: FilterKey) {
        const next = applyToggle(searchParams, k, !isOn(searchParams, k));
        const qs = next.toString();
        router.push((qs ? `${pathname}?${qs}` : pathname) as Route);
    }

    const visibleKeys = workerCounty
        ? FILTER_KEYS
        : FILTER_KEYS.filter((k) => k !== 'my_county');

    return (
        <div className="border-base-300 mb-[18px] flex flex-wrap items-center gap-2.5 rounded-2xl border bg-white px-3.5 py-3">
            <span className="text-base-content/60 font-mono text-xs font-bold uppercase tracking-[0.06em] pr-1.5">
                {t('filters_label')}
            </span>
            {visibleKeys.map((k) => {
                const on = isOn(searchParams, k);
                const label =
                    k === 'my_county'
                        ? t('filter.my_county', { county: workerCounty ?? '' })
                        : t(`filter.${k}` as 'filter.this_week');
                return (
                    <button
                        type="button"
                        key={k}
                        aria-pressed={on}
                        onClick={() => toggle(k)}
                        className={[
                            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
                            on
                                ? 'bg-primary text-primary-content'
                                : 'bg-base-200 text-base-content/70 hover:bg-base-300',
                        ].join(' ')}
                    >
                        {on && <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />}
                        {label}
                    </button>
                );
            })}
            <SortControl />
        </div>
    );
}

const SORT_OPTIONS = ['best', 'newest', 'wage_high', 'starts_soon'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

function SortControl() {
    const t = useTranslations('worker.jobs.browse');
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const current: SortOption =
        (SORT_OPTIONS as readonly string[]).includes(searchParams.get('sort') ?? '')
            ? (searchParams.get('sort') as SortOption)
            : 'best';

    function setSort(value: SortOption) {
        const next = new URLSearchParams(searchParams);
        next.delete('cursor');
        if (value === 'best') next.delete('sort');
        else next.set('sort', value);
        const qs = next.toString();
        router.push((qs ? `${pathname}?${qs}` : pathname) as Route);
    }

    return (
        <details className="dropdown dropdown-end ml-auto">
            <summary className="text-base-content/60 inline-flex cursor-pointer list-none items-center gap-1 text-xs">
                {t('sort_label')}{' '}
                <strong className="text-base-content">{t(`sort.${current}`)}</strong>
                <FontAwesomeIcon icon={faChevronDown} className="h-2.5 w-2.5" />
            </summary>
            <ul className="menu dropdown-content bg-base-100 border-base-300 rounded-box z-10 mt-1 w-52 border p-2 shadow-md">
                {SORT_OPTIONS.map((opt) => (
                    <li key={opt}>
                        <button
                            type="button"
                            onClick={() => setSort(opt)}
                            className={opt === current ? 'menu-active' : ''}
                        >
                            {t(`sort.${opt}`)}
                        </button>
                    </li>
                ))}
            </ul>
        </details>
    );
}
