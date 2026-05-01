import { useTranslations } from 'next-intl';

type Props = { id: '1' | '2' | '3' | '4' };

export function FeaturedProgramCard({ id }: Props) {
    const t = useTranslations(`landing.featured_training.programs.${id}`);
    const cardT = useTranslations('landing.featured_training.card');
    const isFeature = (t.raw('feature') as unknown) === true;
    const tags = t.raw('tags') as string[];

    const containerClass = isFeature ? 'bg-primary text-primary-content' : 'card-bordered border-base-300 bg-base-100';
    const titleClass = isFeature ? 'text-primary-content' : 'text-base-content';
    const bodyClass = isFeature ? 'text-primary-content/80' : 'text-base-content';
    const scheduleClass = isFeature ? 'text-accent' : 'text-secondary';
    const tagBadgeClass = isFeature ? 'badge-secondary' : 'badge-ghost bg-base-300 text-base-content border-0';
    const dividerClass = isFeature ? 'border-secondary' : 'border-base-300';
    const priceClass = isFeature ? 'text-accent' : 'text-primary';
    const ctaBtnClass = isFeature ? 'btn-accent' : 'btn-primary';

    return (
        <article className={`card h-full ${containerClass}`}>
            <div className="card-body p-8 gap-4">
                <div className="flex items-center justify-between">
                    <span className="badge badge-accent font-semibold tracking-wider">{t('badge')}</span>
                    <span className={`font-mono text-xs ${scheduleClass}`}>{t('schedule')}</span>
                </div>

                <h3 className={`card-title font-serif text-2xl font-semibold leading-tight tracking-tight ${titleClass}`}>
                    {t('title')}
                </h3>

                <p className={`font-sans text-sm leading-relaxed ${bodyClass}`}>{t('body')}</p>

                <ul className="flex flex-wrap gap-1.5">
                    {tags.map((tag, i) => (
                        <li key={i}>
                            <span className={`badge ${tagBadgeClass}`}>{tag}</span>
                        </li>
                    ))}
                </ul>

                <div className={`card-actions mt-auto items-center justify-between border-t pt-3.5 ${dividerClass}`}>
                    <span className={`font-serif text-lg font-semibold ${priceClass}`}>{t('price')}</span>
                    <a href={`/training/${id}`} className={`btn  ${ctaBtnClass}`}>
                        {cardT('enroll')}
                    </a>
                </div>
            </div>
        </article>
    );
}
