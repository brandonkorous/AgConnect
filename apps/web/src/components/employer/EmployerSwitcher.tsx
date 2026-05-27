'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faCheck, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useActiveEmployer } from '@/lib/context/active-employer-context';

type EmployerOption = { employerId: string; legalName: string };

type Props = {
    options: EmployerOption[];
    activeEmployerId: string | null;
};

// Renders only when the signed-in identity belongs to more than one
// employer. Picking one persists the active-employer cookie server-side;
// every API request then carries X-Employer-Id (re-validated by the API).
export function EmployerSwitcher({ options, activeEmployerId }: Props) {
    const t = useTranslations('employer.shell.switcher');
    const queryClient = useQueryClient();
    const { setActiveEmployer } = useActiveEmployer();
    const pending = false;

    const active = options.find((o) => o.employerId === activeEmployerId) ?? options[0];

    function pick(employerId: string) {
        if (employerId === activeEmployerId) return;
        setActiveEmployer(employerId);
        void queryClient.invalidateQueries({ queryKey: ['employer'] });
        void queryClient.invalidateQueries({ queryKey: ['me'] });
    }

    return (
        <div className="dropdown w-full px-2 pb-3">
            <button
                type="button"
                tabIndex={0}
                disabled={pending}
                aria-label={t('aria')}
                className="bg-base-100 border-base-300 hover:border-base-content/30 flex w-full items-center gap-2 rounded-2xl border px-3 py-2 text-left"
            >
                <FontAwesomeIcon
                    icon={faBuilding}
                    className="text-base-content/50 h-3.5 w-3.5 shrink-0"
                />
                <span className="min-w-0 flex-1">
                    <span className="text-base-content/50 block font-mono text-[10px] uppercase tracking-wider">
                        {t('label')}
                    </span>
                    <span className="block truncate text-sm font-semibold">
                        {active?.legalName ?? '—'}
                    </span>
                </span>
                {pending ? (
                    <span className="loading loading-spinner loading-xs" />
                ) : (
                    <FontAwesomeIcon
                        icon={faChevronDown}
                        className="text-base-content/40 h-3 w-3 shrink-0"
                    />
                )}
            </button>
            <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 border-base-300 rounded-box z-30 mt-1 max-h-80 w-[216px] overflow-y-auto border p-2 shadow-lg"
            >
                {options.map((o) => (
                    <li key={o.employerId}>
                        <button
                            type="button"
                            onClick={() => pick(o.employerId)}
                            className={o.employerId === activeEmployerId ? 'active' : ''}
                        >
                            <span className="flex-1 truncate">{o.legalName}</span>
                            {o.employerId === activeEmployerId && (
                                <FontAwesomeIcon icon={faCheck} className="text-primary h-3 w-3" />
                            )}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
