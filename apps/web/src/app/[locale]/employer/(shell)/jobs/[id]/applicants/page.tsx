import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { getEmployerJob, listInbox } from '@/lib/api/employer';
import { HiringPipelineBoard, type PipelineLane } from '@/components/employer/primitives';

type Props = { params: Promise<{ locale: string; id: string }> };

const LANE_KEYS = ['applied', 'reviewed', 'hired'] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.kanban' });
    return { title: `AgConn — ${t('applied')}` };
}

export default async function JobApplicantsPage({ params }: Props) {
    const { locale, id } = await params;
    const tKan = await getTranslations({ locale, namespace: 'employer.kanban' });
    const tForm = await getTranslations({ locale, namespace: 'employer.jobs.form' });
    const tDash = await getTranslations({ locale, namespace: 'employer.dashboard.pipeline' });
    const job = await getEmployerJob(id);
    if (!job) notFound();

    const apps = await listInbox();
    const forJob = apps.filter((a) => a.job.id === id);

    const title = locale === 'es' ? job.titleEs : job.titleEn;
    const wageLabel = formatWage(job.wageMin, job.wageMax, locale);
    const eyebrowParts = [title.toUpperCase()];
    if (job.humanId) eyebrowParts.push(`#${job.humanId}`);
    const eyebrow = eyebrowParts.join(' · ');

    const lanes: PipelineLane[] = LANE_KEYS.map((key) => ({
        key,
        label: tKan(key),
        emptyCopy: tKan('empty_stage'),
        items: forJob
            .filter((a) => a.status === key)
            .map((a) => ({
                id: a.id,
                firstName: a.worker.firstName,
                lastInitial: a.worker.lastInitial,
                appliedAt: a.appliedAt,
                href: `/${locale}/employer/applications/${a.id}`,
                status: key,
                matchLabel:
                    a.worker.skillsMatchCount > 0
                        ? `${a.worker.skillsMatchCount} ${tDash('match')}`
                        : undefined,
            })),
    }));

    return (
        <div className=" px-5 pb-16 pt-8">
            <div className="mb-6">
                <Link
                    href={`/${locale}/employer/jobs`}
                    className="text-base-content/60 hover:text-base-content inline-flex items-center text-sm"
                >
                    <FontAwesomeIcon icon={faChevronLeft} className="mr-2 h-3 w-3" />
                    {tForm('back')}
                </Link>
                <div className="text-base-content/55 mt-3 font-mono text-xs font-bold uppercase tracking-wider">
                    {eyebrow}
                </div>
                <h1 className="font-display mt-1.5 text-4xl font-light leading-tight tracking-tight md:text-5xl">
                    {tKan('applied')}{' '}
                    <em className="text-primary font-light italic">{title}</em>
                </h1>
                <p className="text-base-content/60 mt-2 text-sm">
                    {job.county}
                    {wageLabel ? ` · ${wageLabel}` : ''}
                    {' · '}
                    {job.hireCount}/{job.positionsTotal}
                </p>
            </div>

            <HiringPipelineBoard lanes={lanes} moreLabel={tDash('more')} />
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
