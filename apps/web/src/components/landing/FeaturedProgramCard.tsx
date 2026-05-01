import { getTranslations } from 'next-intl/server';
import type { FeaturedProgram } from '@/lib/api/landing';

type Props = {
    program: FeaturedProgram;
    locale: 'en' | 'es';
    featured?: boolean;
};

function formatDateRange(start: string, end: string, locale: 'en' | 'es') {
    const fmt = new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        month: 'short',
        day: 'numeric',
    });
    return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}

export async function FeaturedProgramCard({ program, locale, featured = false }: Props) {
    const cardT = await getTranslations('landing.featured_training.card');
    const title = locale === 'es' ? program.titleEs : program.titleEn;
    const schedule = formatDateRange(program.startDate, program.endDate, locale);
    const spotsLabel = cardT('spots_left', { n: program.spotsLeft, capacity: program.capacity });

    const containerClass = featured
        ? 'bg-primary text-primary-content'
        : 'card-bordered border-base-300 bg-base-100';
    const titleClass = featured ? 'text-primary-content' : 'text-base-content';
    const bodyClass = featured ? 'text-primary-content/80' : 'text-base-content';
    const scheduleClass = featured ? 'text-accent' : 'text-secondary';
    const dividerClass = featured ? 'border-secondary' : 'border-base-300';
    const priceClass = featured ? 'text-accent' : 'text-primary';
    const ctaBtnClass = featured ? 'btn-accent' : 'btn-primary';

    return (
        <article className={`card h-full ${containerClass}`}>
            <div className="card-body p-8 gap-4">
                <div className="flex items-center justify-between">
                    <span className="badge badge-accent font-semibold tracking-wider uppercase">
                        {program.funder}
                    </span>
                    <span className={`font-mono text-xs ${scheduleClass}`}>{schedule}</span>
                </div>

                <h3 className={`card-title font-serif text-2xl font-semibold leading-tight tracking-tight ${titleClass}`}>
                    {title}
                </h3>

                <p className={`font-sans text-sm leading-relaxed ${bodyClass}`}>
                    {program.locationName} · {program.county}
                </p>

                <p className={`font-mono text-xs uppercase tracking-wider ${scheduleClass}`}>
                    {spotsLabel}
                </p>

                <div className={`card-actions mt-auto items-center justify-between border-t pt-3.5 ${dividerClass}`}>
                    <span className={`font-serif text-lg font-semibold ${priceClass}`}>
                        {cardT('free')}
                    </span>
                    <a href={`/${locale}/training/${program.seoSlug}`} className={`btn ${ctaBtnClass}`}>
                        {cardT('enroll')}
                    </a>
                </div>
            </div>
        </article>
    );
}
