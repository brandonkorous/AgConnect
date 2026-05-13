import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faLocationDot,
    faArrowRight,
    faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { CropGlyph } from '@/components/jobs/CropGlyph';
import { inferCrop } from '@/lib/crop';
import type { RecommendedJob } from '@/lib/api/jobs';

type Props = { job: RecommendedJob; locale: string };

export function WorkerJobCard({ job, locale }: Props) {
    const t = useTranslations('worker.dashboard.matched');
    const title = locale === 'es' ? job.titleEs : job.titleEn;
    const crop = inferCrop(job.titleEn, job.skills);

    return (
        <Link
            href={`/${locale}/worker/jobs/${job.seoSlug}`}
            className="bg-base-100 border-base-300 hover:border-primary/40 flex flex-col gap-4 rounded-2xl border p-4 shadow-sm transition-colors no-underline"
        >
            <div className="flex items-start gap-3">
                <div className="bg-base-200 grid h-11 w-11 shrink-0 place-items-center rounded-xl">
                    <CropGlyph crop={crop} size={26} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="text-base-content truncate text-base font-semibold leading-tight tracking-tight">
                            {title}
                        </h4>
                        {job.employerVerified && (
                            <span className="badge badge-success gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
                                <FontAwesomeIcon icon={faCircleCheck} className="h-2.5 w-2.5" />
                                {t('verified')}
                            </span>
                        )}
                    </div>
                    <div className="text-base-content/70 mt-1 flex items-center gap-1.5 text-sm">
                        <span className="truncate">{job.employerName}</span>
                        <span className="bg-base-300 h-[3px] w-[3px] shrink-0 rounded-full" aria-hidden />
                        <FontAwesomeIcon
                            icon={faLocationDot}
                            className="text-base-content/50 h-3 w-3 shrink-0"
                        />
                        <span className="truncate">{job.county} County</span>
                    </div>
                </div>
            </div>

            <div className="flex items-end justify-between gap-3">
                <div>
                    <div className="font-serif text-2xl font-medium leading-none tracking-tight">
                        ${job.wageMin}–${job.wageMax}
                    </div>
                    <div className="text-base-content/60 mt-1 text-xs">/{job.wageUnit}</div>
                </div>
                <div className="text-right">
                    <div className="text-base-content/60 text-xs">{t('starts')}</div>
                    <div className="font-mono text-sm font-semibold">{job.startDate}</div>
                </div>
                <span className="btn btn-neutral btn-sm">
                    {t('apply')}
                    <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                </span>
            </div>

            {job.housing && (
                <div>
                    <span className="badge badge-ghost border-base-300 bg-base-100 px-2 py-1 text-xs font-normal">
                        {t('housing')}
                    </span>
                </div>
            )}
        </Link>
    );
}
