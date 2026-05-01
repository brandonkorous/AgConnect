import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faLeaf,
    faLocationDot,
    faArrowRight,
    faCircleCheck,
    faBolt,
    faStar,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { Badge, JobMock } from './workerMockData';

const BADGE_ICON: Record<Badge, IconDefinition> = {
    verified: faCircleCheck,
    hiring_fast: faBolt,
    top_employer: faStar,
};

const BADGE_CLASS: Record<Badge, string> = {
    verified: 'badge-success',
    hiring_fast: 'badge-warning',
    top_employer: 'badge-primary',
};

export function WorkerJobCard({ job }: { job: JobMock }) {
    const t = useTranslations('worker.dashboard.matched');

    return (
        <article className="bg-base-100 border-base-300 flex flex-col gap-4 rounded-2xl border p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="bg-base-200 grid h-11 w-11 shrink-0 place-items-center rounded-xl">
                    <FontAwesomeIcon icon={faLeaf} className="text-primary h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="text-base font-semibold leading-tight tracking-tight">
                            {job.title}
                        </h4>
                        <span
                            className={`badge ${BADGE_CLASS[job.badge]} gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider`}
                        >
                            <FontAwesomeIcon icon={BADGE_ICON[job.badge]} className="h-2.5 w-2.5" />
                            {t(job.badge)}
                        </span>
                    </div>
                    <div className="text-base-content/70 mt-1 flex items-center gap-1.5 text-sm">
                        <span>{job.employer}</span>
                        <span className="bg-base-300 h-[3px] w-[3px] rounded-full" aria-hidden />
                        <FontAwesomeIcon
                            icon={faLocationDot}
                            className="text-base-content/50 h-3 w-3"
                        />
                        <span>{job.county}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-end justify-between gap-3">
                <div>
                    <div className="font-serif text-2xl font-medium leading-none tracking-tight">
                        {job.pay}
                    </div>
                    <div className="text-base-content/60 mt-1 text-xs">{job.payNote}</div>
                </div>
                <div className="text-right">
                    <div className="text-base-content/60 text-xs">{t('starts')}</div>
                    <div className="font-mono text-sm font-semibold">{job.start}</div>
                </div>
                <button type="button" className="btn btn-neutral btn-sm">
                    {t('apply')}
                    <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
                <span className="badge badge-ghost border-base-300 bg-base-100 px-2 py-1 text-[11px] font-normal">
                    {t('spots', { count: job.spots })}
                </span>
                {job.housing && (
                    <span className="badge badge-ghost border-base-300 bg-base-100 px-2 py-1 text-[11px] font-normal">
                        {t('housing')}
                    </span>
                )}
                <span className="badge badge-ghost border-base-300 bg-base-100 px-2 py-1 text-[11px] font-normal">
                    {t('sms_apply')}
                </span>
            </div>
        </article>
    );
}
