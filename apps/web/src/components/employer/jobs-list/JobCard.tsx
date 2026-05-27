import Link from 'next/link';
import type { Route } from 'next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSeedling,
    faLocationDot,
    faCoins,
    faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import type { EmployerJobView } from '@/lib/api/hooks/employer';
import { StatusBadge } from '@/components/employer/primitives';
import { JobActionMenu } from './JobActionMenu';

type Strings = {
    edit: string;
    starts: string;
    crew: string;
    confirmed: string;
    applicantsShort: string;
    newShort: string;
    reviewLabel: string;
    statusLabel: string;
    actionLabels: {
        label: string;
        edit: string;
        applicants: string;
        duplicate: string;
        close: string;
        discard: string;
        pauseRenotify: string;
        resumeRenotify: string;
        confirmDiscardTitle: string;
        confirmDiscardBody: string;
        confirmCloseTitle: string;
        confirmCloseBody: string;
        cancel: string;
        confirmDiscard: string;
        confirmClose: string;
    };
};

type Props = {
    job: EmployerJobView;
    locale: string;
    startsLabel: string;
    durationLabel: string;
    strings: Strings;
};

export function JobCard({ job, locale, startsLabel, durationLabel, strings }: Props) {
    const open = job.positionsTotal - job.hireCount;
    const pct = job.positionsTotal > 0 ? (job.hireCount / job.positionsTotal) * 100 : 0;
    const statusKey = resolveStatusKey(job, open);
    const totalApplicants =
        job.applicationCounts.applied + job.applicationCounts.reviewed + job.applicationCounts.hired;
    const progressVariant = pct === 100 ? 'progress-success' : pct > 50 ? 'progress-accent' : 'progress-error';

    return (
        <article className="card card-bordered card-compact bg-base-100 border-base-300">
            <div className="card-body p-5">
                <div className="flex items-start gap-3.5">
                    <div className="bg-base-200 grid h-11 w-11 shrink-0 place-items-center rounded-xl">
                        <FontAwesomeIcon icon={faSeedling} className="text-primary h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[17px] font-semibold leading-tight tracking-tight">
                                {locale === 'es' ? job.titleEs : job.titleEn}
                            </h3>
                            <StatusBadge status={statusKey} label={strings.statusLabel} />
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
                    <JobActionMenu
                        jobId={job.id}
                        locale={locale}
                        status={job.status}
                        renotifyPaused={job.renotifyPaused ?? false}
                        labels={strings.actionLabels}
                    />
                </div>

                <div className="border-base-300 mt-4 grid grid-cols-2 gap-2.5 border-y border-dashed py-3">
                    <div>
                        <div className="text-base-content/60 font-mono text-[10px] font-bold uppercase tracking-wider">
                            {strings.starts}
                        </div>
                        <div className="mt-0.5 text-sm font-semibold">{startsLabel}</div>
                        <div className="text-base-content/60 text-xs">{durationLabel}</div>
                    </div>
                    <div>
                        <div className="text-base-content/60 font-mono text-[10px] font-bold uppercase tracking-wider">
                            {strings.crew}
                        </div>
                        <div className="mt-0.5 text-sm font-semibold">
                            {job.hireCount}/{job.positionsTotal} {strings.confirmed}
                        </div>
                        <progress
                            className={`progress ${progressVariant} mt-1 h-1.5 w-full`}
                            value={pct}
                            max={100}
                        />
                    </div>
                </div>

                <div className="mt-3.5 flex items-center justify-between">
                    <div className="text-base-content/70 text-xs">
                        <strong className="text-primary font-mono">{totalApplicants}</strong>{' '}
                        {strings.applicantsShort} ·{' '}
                        <span className="text-accent">
                            {job.applicationCounts.applied} {strings.newShort}
                        </span>
                    </div>
                    <div className="flex gap-1.5">
                        <Link
                            href={`/${locale}/employer/jobs/${job.id}` as Route}
                            className="btn btn-xs btn-ghost border-base-300 rounded-full border"
                        >
                            {strings.edit}
                        </Link>
                        <Link
                            href={`/${locale}/employer/jobs/${job.id}/applicants` as Route}
                            className="btn btn-xs btn-neutral rounded-full"
                        >
                            {strings.reviewLabel}
                            <FontAwesomeIcon icon={faArrowRight} className="ml-1 h-2.5 w-2.5" />
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}

function resolveStatusKey(
    job: EmployerJobView,
    open: number,
): 'filled' | 'closed' | 'draft' | 'urgent' | 'warn' | 'live' {
    if (job.status === 'filled') return 'filled';
    if (job.status === 'closed') return 'closed';
    if (job.status === 'draft') return 'draft';
    if (open === 0) return 'filled';
    if (open <= job.positionsTotal / 2) return 'warn';
    return 'urgent';
}
