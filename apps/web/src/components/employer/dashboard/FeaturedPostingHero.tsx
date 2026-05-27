import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUsers,
    faCoins,
    faLocationDot,
    faPlus,
    faComments,
    faCheck,
    faUserPlus,
} from '@fortawesome/free-solid-svg-icons';
import type { EmployerJobView, ApplicantCardView } from '@/lib/api/hooks/employer';

type Props = {
    locale: string;
    job: EmployerJobView;
    applicants: ApplicantCardView[];
};

export async function FeaturedPostingHero({ locale, job, applicants }: Props) {
    const t = await getTranslations({ locale, namespace: 'employer.dashboard.hero' });
    const title = locale === 'es' ? job.titleEs : job.titleEn;
    const filled = job.hireCount;
    const total = job.positionsTotal;
    const open = total - filled;
    const slots = Array.from({ length: total });
    const startsAt = formatStartsAt(job.startDate, locale);

    const hiredInits = applicants
        .filter((a) => a.status === 'hired' && a.job.id === job.id)
        .slice(0, total)
        .map((a) => initials(a.worker.firstName, a.worker.lastInitial));

    return (
        <section className="bg-base-content text-base-100 relative mb-7 overflow-hidden rounded-2xl p-7">
            <div
                aria-hidden
                className="from-accent/30 absolute inset-0 bg-[radial-gradient(ellipse_60%_100%_at_100%_0%,_var(--tw-gradient-from),_transparent_60%)]"
            />
            <div className="relative grid grid-cols-1 gap-8 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                    <p className="text-accent font-mono text-xs uppercase tracking-wider">
                        {startsAt} · {job.county}
                        {job.city ? ` · ${job.city}` : ''}
                    </p>
                    <h2 className="font-display mt-2 text-3xl font-light leading-tight tracking-tight md:text-4xl">
                        {title} —{' '}
                        <em className="text-accent not-italic font-light">
                            {open === 0
                                ? t('all_filled')
                                : t('open_count', { count: open })}
                        </em>
                    </h2>
                    <div className="text-base-100/75 mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                        <span className="inline-flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faUsers} className="h-3.5 w-3.5" />
                            {filled}/{total} {t('filled')}
                        </span>
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                            <FontAwesomeIcon icon={faCoins} className="h-3.5 w-3.5" />
                            {formatHourly(job.wageMin, locale)}
                            {job.wageMax !== job.wageMin ? `–${formatHourly(job.wageMax, locale)}` : ''}/hr
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faLocationDot} className="h-3.5 w-3.5" />
                            {job.county}
                        </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                        {slots.map((_, i) => (
                            <div
                                key={i}
                                className={[
                                    'grid h-8 w-8 place-items-center rounded-full font-mono text-[10px] font-bold',
                                    i < filled
                                        ? 'bg-primary text-primary-content'
                                        : 'bg-base-100/10 text-base-100/50 border-base-100/30 border border-dashed',
                                ].join(' ')}
                                aria-label={i < filled ? t('slot_filled_aria') : t('slot_open_aria')}
                            >
                                {i < filled ? (
                                    hiredInits[i] ?? (
                                        <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" />
                                    )
                                ) : (
                                    <FontAwesomeIcon icon={faUserPlus} className="h-3 w-3" />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                        <Link
                            href={`/${locale}/employer/jobs/${job.id}/applicants`}
                            className="bg-accent text-base-content inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold"
                        >
                            {open > 0 ? t('fill_spot') : t('view_crew')}
                            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                        </Link>
                        <Link
                            href={`/${locale}/employer/messages?job=${job.id}`}
                            className="border-base-100/25 inline-flex items-center gap-1.5 rounded-full border bg-transparent px-4 py-2 text-sm font-semibold"
                        >
                            <FontAwesomeIcon icon={faComments} className="h-3 w-3" />
                            {t('message_crew')}
                        </Link>
                    </div>
                </div>
                <div className="border-base-100/10 relative h-[180px] w-[200px] shrink-0 overflow-hidden rounded-xl border bg-gradient-to-br from-[#2a3d2f] to-[#1a2620]">
                    <svg viewBox="0 0 220 200" className="absolute inset-0 opacity-50">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <line
                                key={i}
                                x1="0"
                                y1={25 + i * 22}
                                x2="220"
                                y2={25 + i * 22}
                                stroke="rgba(245,158,11,0.25)"
                                strokeWidth="1"
                            />
                        ))}
                    </svg>
                    <div className="text-base-100/60 absolute left-3 top-3 font-mono text-[10px] uppercase tracking-wider">
                        {(job.city ?? job.county).toUpperCase()}
                    </div>
                    <div className="text-accent absolute bottom-3 left-3">
                        <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4" />
                    </div>
                    <div className="text-base-100/60 absolute bottom-3 right-3 font-mono text-[10px]">
                        {durationLabel(job.startDate, job.endDate, locale)}
                    </div>
                </div>
            </div>
        </section>
    );
}

function initials(first: string, lastInit: string): string {
    return `${(first[0] ?? '').toUpperCase()}${lastInit.toUpperCase()}`;
}

function formatStartsAt(startDate: string, locale: string): string {
    // Parse YYYY-MM-DD as local components, not UTC, so dates render the same
    // day everyone agreed to — matches /employer/jobs list rendering.
    const [y, m, d] = startDate.split('-').map(Number);
    if (!y || !m || !d) return startDate;
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    }).format(new Date(y, m - 1, d));
}

function formatHourly(value: number, locale: string): string {
    return new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

function durationLabel(startDate: string, endDate: string | null, locale: string): string {
    if (!endDate) return locale === 'es' ? 'continuo' : 'ongoing';
    const days = Math.max(
        1,
        Math.round(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) / (24 * 60 * 60 * 1000),
        ),
    );
    return locale === 'es' ? `~${days}d` : `~${days}d`;
}
