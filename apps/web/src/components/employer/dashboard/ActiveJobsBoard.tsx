import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faSeedling } from '@fortawesome/free-solid-svg-icons';
import type { EmployerJobView } from '@/lib/api/employer';

type Props = {
    locale: string;
    jobs: EmployerJobView[];
};

export async function ActiveJobsBoard({ locale, jobs }: Props) {
    const t = await getTranslations({ locale, namespace: 'employer.dashboard.active_jobs' });

    const visible = jobs
        .filter((j) => j.status === 'active' || j.status === 'filled')
        .slice(0, 4);
    const openCount = jobs.filter((j) => j.status === 'active').length;
    const applicantsThisWeek = jobs.reduce(
        (sum, j) => sum + j.applicationCounts.applied + j.applicationCounts.reviewed,
        0,
    );

    return (
        <section className="bg-base-100 border-base-300 overflow-hidden rounded-2xl border">
            <div className="border-base-300 flex items-center justify-between border-b px-5 py-4">
                <div>
                    <h2 className="font-display text-xl font-light tracking-tight">{t('title')}</h2>
                    <div className="text-base-content/60 mt-0.5 text-xs">
                        {t('subtitle', { open: openCount, applicants: applicantsThisWeek })}
                    </div>
                </div>
                <Link
                    href={`/${locale}/employer/jobs`}
                    className="text-primary text-sm font-semibold"
                >
                    {t('manage_all')} →
                </Link>
            </div>
            {visible.length === 0 && (
                <div className="text-base-content/60 p-8 text-center text-sm">{t('empty')}</div>
            )}
            {visible.map((j, i) => {
                const filled = j.hireCount;
                const total = j.positionsTotal;
                const pct = total > 0 ? (filled / total) * 100 : 0;
                const urgency = j.status === 'filled' ? 'success' : pct >= 50 ? 'warning' : 'open';
                const urgencyTone = {
                    success: 'bg-success/15 text-success',
                    warning: 'bg-warning/15 text-warning',
                    open: 'bg-base-200 text-base-content/70',
                }[urgency];
                const barColor = {
                    success: 'bg-success',
                    warning: 'bg-accent',
                    open: 'bg-primary',
                }[urgency];
                const status = j.status === 'filled' ? t('status_filled') : t('status_open', { n: total - filled });

                return (
                    <Link
                        key={j.id}
                        href={`/${locale}/employer/jobs/${j.id}/applicants`}
                        className={[
                            'hover:bg-base-200 grid items-center gap-4 px-5 py-4 transition-colors',
                            'grid-cols-[44px_1.6fr_1fr_0.9fr_72px_24px]',
                            i < visible.length - 1 ? 'border-base-300 border-b' : '',
                        ].join(' ')}
                    >
                        <div className="bg-base-200 grid h-11 w-11 place-items-center rounded-lg">
                            <FontAwesomeIcon icon={faSeedling} className="text-base-content/70 h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                                {locale === 'es' ? j.titleEs : j.titleEn}
                            </div>
                            <div className="text-base-content/60 mt-0.5 truncate text-xs">
                                {j.applicationCounts.applied + j.applicationCounts.reviewed} {t('applicants')} · {j.county}
                                {j.city ? ` · ${j.city}` : ''}
                            </div>
                        </div>
                        <div>
                            <div className="font-mono text-xs font-bold">
                                {filled}/{total} {t('filled_short')}
                            </div>
                            <div className="bg-base-200 mt-1 h-1.5 overflow-hidden rounded-full">
                                <div className={['h-full', barColor].join(' ')} style={{ width: `${pct}%` }} />
                            </div>
                        </div>
                        <div>
                            <span
                                className={[
                                    'rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
                                    urgencyTone,
                                ].join(' ')}
                            >
                                {status}
                            </span>
                        </div>
                        <div className="border-base-300 rounded-full border px-2.5 py-1 text-center text-xs font-semibold">
                            {t('review_n', { n: j.applicationCounts.applied })}
                        </div>
                        <FontAwesomeIcon
                            icon={faArrowRight}
                            className="text-base-content/40 h-3 w-3"
                        />
                    </Link>
                );
            })}
        </section>
    );
}
