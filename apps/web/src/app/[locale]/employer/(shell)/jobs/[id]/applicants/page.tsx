import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { getEmployerJob, listInbox } from '@/lib/api/employer';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.kanban' });
    return { title: `AgConn — ${t('applied')}` };
}

export default async function JobApplicantsPage({ params }: Props) {
    const { locale, id } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.kanban' });
    const tForm = await getTranslations({ locale, namespace: 'employer.jobs.form' });
    const job = await getEmployerJob(id);
    if (!job) notFound();

    const apps = await listInbox();
    const forJob = apps.filter((a) => a.job.id === id);

    const cols = {
        applied: forJob.filter((a) => a.status === 'applied'),
        reviewed: forJob.filter((a) => a.status === 'reviewed'),
        hired: forJob.filter((a) => a.status === 'hired'),
    };

    const title = locale === 'es' ? job.titleEs : job.titleEn;
    const wageLabel = formatWage(job.wageMin, job.wageMax, locale);
    const eyebrow = `${title.toUpperCase()} · #${job.humanId ?? ''}`.trim();

    return (
        <div className="container mx-auto px-5 pb-16 pt-8 md:px-8 lg:px-20">
            <div className="mb-6">
                <Link
                    href={`/${locale}/employer/jobs`}
                    className="text-base-content/60 hover:text-base-content inline-flex items-center text-sm"
                >
                    <FontAwesomeIcon icon={faChevronLeft} className="mr-2 h-3 w-3" />
                    {tForm('back')}
                </Link>
                <div className="text-base-content/55 mt-3 font-mono text-[11px] font-bold uppercase tracking-wider">
                    {eyebrow}
                </div>
                <h1 className="font-display mt-1.5 text-4xl font-light leading-tight tracking-tight md:text-5xl">
                    {t('applied')}{' '}
                    <em className="text-primary font-light italic">{title}</em>
                </h1>
                <p className="text-base-content/60 mt-2 text-sm">
                    {job.county}
                    {wageLabel ? ` · ${wageLabel}` : ''}
                    {' · '}
                    {job.hireCount}/{job.positionsTotal}
                </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <Column title={t('applied')} apps={cols.applied} locale={locale} />
                <Column title={t('reviewed')} apps={cols.reviewed} locale={locale} />
                <Column title={t('hired')} apps={cols.hired} locale={locale} />
            </div>
        </div>
    );
}

function formatWage(min: number, max: number, locale: string): string {
    if (!(min > 0) && !(max > 0)) {
        return locale === 'es' ? 'Sueldo por confirmar' : 'Wage TBD';
    }
    if (min === max) return `$${min}/hr`;
    return `$${min}–$${max}/hr`;
}

async function Column({
    title,
    apps,
    locale,
}: {
    title: string;
    apps: Awaited<ReturnType<typeof listInbox>>;
    locale: string;
}) {
    const tKan = await getTranslations({ locale, namespace: 'employer.kanban' });
    return (
        <section className="bg-base-100 border-base-300 rounded-2xl border p-4">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{title}</h2>
                <span className="text-base-content/60 font-mono text-xs">{apps.length}</span>
            </div>
            <div className="flex flex-col gap-2">
                {apps.map((a) => (
                    <Link
                        key={a.id}
                        href={`/${locale}/employer/applications/${a.id}`}
                        className="border-base-300 hover:bg-base-200 rounded-xl border p-3 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <div className="bg-primary text-primary-content grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold">
                                {a.worker.firstName[0]}
                                {a.worker.lastInitial}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold">
                                    {a.worker.firstName} {a.worker.lastInitial}.
                                </div>
                                <div className="text-base-content/60 text-xs">{a.worker.county}</div>
                            </div>
                        </div>
                        {a.worker.skillsMatchCount > 0 && (
                            <div className="text-primary mt-2 font-mono text-[10px]">
                                {a.worker.skillsMatchCount} match
                            </div>
                        )}
                    </Link>
                ))}
                {apps.length === 0 && (
                    <div className="text-base-content/45 py-8 text-center text-xs italic">
                        {tKan('empty_stage')}
                    </div>
                )}
            </div>
        </section>
    );
}
