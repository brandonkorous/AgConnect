import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faLeaf } from '@fortawesome/free-solid-svg-icons';

type Props = { id: '1' | '2' | '3' | '4' };

export function FeaturedJobCard({ id }: Props) {
    const t = useTranslations(`landing.featured_jobs.jobs.${id}`);
    const cardT = useTranslations('landing.featured_jobs.card');
    const isGrower = t('type') === 'grower';
    const tags = t.raw('tags') as string[];

    return (
        <article className="card card-bordered border-base-300 h-full bg-base-100">
            <div className="card-body p-6 gap-3.5">
                <div className="flex items-center justify-between">
                    <div className={`badge gap-1.5 ${isGrower ? 'badge-accent' : 'badge-primary'}`}>
                        <FontAwesomeIcon
                            icon={isGrower ? faLeaf : faStar}
                            className="text-[10px]"
                        />
                        <span className="text-xs font-semibold tracking-wider">
                            {isGrower ? cardT('verified_grower') : cardT('verified_flc')}
                        </span>
                    </div>
                    <span className="text-secondary font-mono text-xs">{t('location')}</span>
                </div>

                <h3 className="card-title text-base-content font-serif text-xl font-semibold leading-tight tracking-tight">
                    {t('title')}
                </h3>

                <p className="text-secondary font-sans text-sm">{t('employer')}</p>

                <ul className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((tag, i) => (
                        <li key={i}>
                            <span className="badge badge-ghost bg-base-300 text-base-content border-0">{tag}</span>
                        </li>
                    ))}
                </ul>

                <div className="border-base-300 mt-auto flex items-center justify-between border-t pt-3.5">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-secondary font-sans text-xs tracking-wider uppercase">
                            {cardT('hourly')}
                        </span>
                        <span className="text-primary font-serif text-lg font-semibold">{t('wage')}</span>
                    </div>
                    <a href={`/jobs/${id}`} className="btn btn-primary ">
                        {cardT('apply')}
                    </a>
                </div>
            </div>
        </article>
    );
}
