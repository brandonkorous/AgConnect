import Link from 'next/link';
import type { Route } from 'next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';

export type FilterKey = 'all' | 'open' | 'urgent' | 'filled' | 'drafts' | 'closed';
export type SortKey = 'urgent' | 'newest' | 'starts_soon';

type FilterEntry = { key: FilterKey; n: number; active: boolean; label: string };

type Props = {
    filters: FilterEntry[];
    sort: { active: SortKey; entries: { key: SortKey; label: string }[] };
    chipHref: (filter: FilterKey) => string;
    sortHref: (sort: SortKey) => string;
};

export function JobsFilterRow({ filters, sort, chipHref, sortHref }: Props) {
    const sortLabel = sort.entries.find((e) => e.key === sort.active)?.label ?? '';
    return (
        <div className="border-base-300 mb-6 flex flex-wrap items-center gap-2 border-b pb-4">
            {filters.map((f) => {
                const isActive = f.active && f.n > 0;
                return (
                    <Link
                        key={f.key}
                        href={chipHref(f.key) as Route}
                        scroll={false}
                        aria-current={f.active ? 'page' : undefined}
                        aria-pressed={isActive}
                        className={[
                            'btn btn-sm rounded-full',
                            isActive ? 'btn-primary' : 'btn-ghost',
                        ].join(' ')}
                    >
                        <span>{f.label}</span>
                        <span className="bg-base-200 text-base-content/70 ml-2 inline-flex items-center justify-center rounded-full px-1.5 font-mono text-[10px]">
                            {f.n}
                        </span>
                    </Link>
                );
            })}
            <div className="flex-1" />
            <details className="dropdown dropdown-end">
                <summary className="btn btn-sm btn-ghost rounded-full">
                    <FontAwesomeIcon icon={faFilter} className="h-2.5 w-2.5" />
                    {sortLabel}
                </summary>
                <ul className="dropdown-content menu menu-sm bg-base-100 border-base-300 rounded-box z-10 mt-2 w-44 border p-2 shadow-md">
                    {sort.entries.map((s) => (
                        <li key={s.key}>
                            <Link
                                href={sortHref(s.key) as Route}
                                scroll={false}
                                aria-current={s.key === sort.active ? 'page' : undefined}
                            >
                                {s.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </details>
        </div>
    );
}
