import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import type { FeaturedJob } from '@/lib/api/landing';

type Props = {
    job: FeaturedJob;
    locale: 'en' | 'es';
};

const wageUnitKey: Record<string, string> = {
    hour: 'hourly',
    day: 'daily',
    piece: 'piece',
};

export async function FeaturedJobCard({ job, locale }: Props) {
    const cardT = await getTranslations('landing.featured_jobs.card');
    const title = locale === 'es' ? job.titleEs : job.titleEn;
    const wage =
        job.wageMin === job.wageMax
            ? `$${job.wageMax.toFixed(2)}`
            : `$${job.wageMin.toFixed(2)}–$${job.wageMax.toFixed(2)}`;
    const hrefSlug = job.seoSlug ?? job.id;
    const unitLabelKey = wageUnitKey[job.wageUnit] ?? 'hourly';

    return (
        <article className="card card-bordered border-base-300 h-full bg-base-100">
            <div className="card-body p-6 gap-3.5">
                <div className="flex items-center justify-between">
                    <div className="badge badge-primary gap-1.5">
                        <FontAwesomeIcon icon={faStar} className="text-[10px]" />
                        <span className="text-xs font-semibold tracking-wider">
                            {cardT('verified_flc')}
                        </span>
                    </div>
                    <span className="text-secondary font-mono text-xs uppercase">{job.county}</span>
                </div>

                <h3 className="card-title text-base-content font-serif text-xl font-semibold leading-tight tracking-tight">
                    {title}
                </h3>

                <p className="text-secondary font-sans text-sm">{job.employerName}</p>

                {job.skills.length > 0 ? (
                    <ul className="flex flex-wrap gap-1.5 pt-1">
                        {job.skills.slice(0, 3).map((skill) => (
                            <li key={skill}>
                                <span className="badge badge-ghost bg-base-300 text-base-content border-0">
                                    {skill}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : null}

                <div className="border-base-300 mt-auto flex items-center justify-between border-t pt-3.5">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-secondary font-sans text-xs tracking-wider uppercase">
                            {cardT(unitLabelKey)}
                        </span>
                        <span className="text-primary font-serif text-lg font-semibold">{wage}</span>
                    </div>
                    <a href={`/${locale}/jobs/${hrefSlug}`} className="btn btn-primary">
                        {cardT('apply')}
                    </a>
                </div>
            </div>
        </article>
    );
}
