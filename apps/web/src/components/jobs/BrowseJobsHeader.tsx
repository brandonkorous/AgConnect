'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot, faBookmark, faCheck } from '@fortawesome/free-solid-svg-icons';
import { createSavedSearchAction } from '@/lib/api/saved-searches-actions';

type Props = {
    totalCount: number;
    county: string;
    locale: string;
};

function searchParamsToFilters(sp: URLSearchParams) {
    const county = sp.get('county');
    const skills = sp.get('skills');
    const wageMin = sp.get('wageMin');
    const startBefore = sp.get('startBefore');
    return {
        ...(county ? { county: [county] } : {}),
        ...(skills
            ? { skills: skills.split(',').map((s) => s.trim()).filter(Boolean) }
            : {}),
        ...(wageMin ? { wageMin: Number(wageMin) } : {}),
        ...(startBefore ? { startBefore } : {}),
    };
}

export function BrowseJobsHeader({ totalCount, county, locale }: Props) {
    const t = useTranslations('worker.jobs.browse');
    const searchParams = useSearchParams();
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function save() {
        setError(null);
        startTransition(async () => {
            const filters = searchParamsToFilters(searchParams);
            const res = await createSavedSearchAction({
                name: null,
                filters,
                alertChannel: 'sms',
                alertActive: true,
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                setError(res.code === 'unauthenticated' ? t('save_search_login') : t('save_search_error'));
            }
        });
    }

    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
                <span className="text-base-content/60 font-mono text-xs font-semibold uppercase tracking-[0.18em]">
                    {t('eyebrow', { count: totalCount, county })}
                </span>
                <h1 className="font-serif mt-2 text-[32px] font-normal leading-[1.05] tracking-[-0.025em] sm:text-[44px]">
                    {t.rich('headline', {
                        shift: (chunks) => (
                            <em className="text-primary font-light italic">{chunks}</em>
                        ),
                    })}
                </h1>
                <p className="text-base-content/70 mt-1.5 max-w-[640px] text-[14.5px]">
                    {t('sub')}
                </p>
                {error && (
                    <div className="text-error mt-2 text-[12px]" role="alert">
                        {error}
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                <Link
                    href={`/${locale}/worker/jobs#map`}
                    className="btn btn-sm btn-ghost border-base-300 rounded-full border"
                >
                    <FontAwesomeIcon icon={faLocationDot} className="h-3.5 w-3.5" />
                    {t('map_view')}
                </Link>
                <button
                    type="button"
                    onClick={save}
                    disabled={pending || saved}
                    className="btn btn-primary btn-sm rounded-full"
                >
                    <FontAwesomeIcon
                        icon={saved ? faCheck : faBookmark}
                        className="h-3.5 w-3.5"
                    />
                    {saved ? t('save_search_saved') : pending ? t('save_search_saving') : t('save_search')}
                </button>
            </div>
        </div>
    );
}
