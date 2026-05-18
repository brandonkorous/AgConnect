import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faLocationDot, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { Pill } from '@/components/worker/primitives/Pill';
import { CropGlyph } from '@/components/jobs/CropGlyph';
import { fetchApplication } from '@/lib/api/applications';
import { inferCrop } from '@/lib/crop';
import { WithdrawButton } from '@/components/applications/WithdrawButton';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'worker.application.detail' });
    return { title: t('title') };
}

const STATUS_TONE: Record<string, 'ghost' | 'primary' | 'success' | 'danger'> = {
    applied: 'ghost',
    reviewed: 'primary',
    hired: 'success',
    rejected: 'danger',
    withdrawn: 'ghost',
};

export default async function ApplicationDetailPage({ params }: Props) {
    const { locale, id } = await params;
    const t = await getTranslations({ locale, namespace: 'worker.application' });
    const tEvent = await getTranslations({ locale, namespace: 'worker.application.detail.event' });
    const data = await fetchApplication(id);
    if (!data) notFound();

    const { application, job, events, employer } = data;
    const title = locale === 'es' ? job.titleEs : job.titleEn;
    const description = locale === 'es' ? job.descriptionEs : job.descriptionEn;
    const crop = inferCrop(job.titleEn, application.skillsAtApply);
    const canWithdraw =
        application.status === 'applied' || application.status === 'reviewed';

    return (
        <div className="px-6 pb-16 pt-8 lg:px-8">
            <Link
                href={`/${locale}/worker/applications`}
                className="text-base-content/70 hover:text-base-content mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium"
            >
                <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
                {t('detail.title')}
            </Link>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
                <div>
                    <div className="flex items-start gap-4">
                        <div className="bg-base-200 grid h-14 w-14 shrink-0 place-items-center rounded-2xl">
                            <CropGlyph crop={crop} size={32} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <Pill tone={STATUS_TONE[application.status]}>
                                {t(`status.${application.status}`)}
                            </Pill>
                            <h1 className="font-serif mt-2 text-[28px] font-normal leading-tight tracking-[-0.025em] sm:text-[36px]">
                                {title}
                            </h1>
                            <div className="text-base-content/70 mt-2 flex flex-wrap items-center gap-3 text-[13.5px]">
                                <span className="inline-flex items-center gap-1.5">
                                    <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" />
                                    {job.county} County
                                </span>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1.5">
                                    <FontAwesomeIcon icon={faCalendarDays} className="h-3 w-3" />
                                    {job.startDate}
                                </span>
                                <span>·</span>
                                <span>${job.wageMin}–${job.wageMax}/hr</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h2 className="font-serif mb-3 text-[20px] tracking-[-0.02em]">
                            {t('detail.about_job')}
                        </h2>
                        <p className="text-base-content/80 whitespace-pre-line text-[14.5px] leading-relaxed">
                            {description}
                        </p>
                        <Link
                            href={`/${locale}/worker/jobs/${job.seoSlug}`}
                            className="text-primary mt-3 inline-block text-[12px] font-semibold"
                        >
                            {locale === 'es' ? 'Ver trabajo' : 'View job'} →
                        </Link>
                    </div>

                    <div className="mt-8">
                        <h2 className="font-serif mb-3 text-[20px] tracking-[-0.02em]">
                            {t('detail.timeline')}
                        </h2>
                        <ol className="border-base-300 grid gap-3 rounded-2xl border bg-white p-5">
                            {events.map((e) => (
                                <li
                                    key={e.id}
                                    className="flex items-start gap-3 text-[13.5px]"
                                >
                                    <div className="bg-primary mt-1.5 h-2 w-2 shrink-0 rounded-full" />
                                    <div className="min-w-0 flex-1">
                                        <div className="font-medium">
                                            {tEvent(e.toStatus)}
                                        </div>
                                        <div className="text-base-content/60 mt-0.5 font-mono text-[11.5px]">
                                            {new Date(e.createdAt).toLocaleString(locale)}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>

                <aside className="grid gap-3.5 self-start">
                    <div className="border-base-300 bg-base-100 grid gap-3 rounded-2xl border p-5">
                        <div className="text-base-content/60 font-mono text-xs font-semibold uppercase tracking-[0.18em]">
                            {locale === 'es' ? 'Empleador' : 'Employer'}
                        </div>
                        <div className="text-[15px] font-semibold">{employer.name}</div>
                        {employer.phone && (
                            <a
                                href={`tel:${employer.phone}`}
                                className="text-primary text-[13px] no-underline"
                            >
                                {employer.phone}
                            </a>
                        )}
                        {employer.email && (
                            <a
                                href={`mailto:${employer.email}`}
                                className="text-primary text-[13px] no-underline"
                            >
                                {employer.email}
                            </a>
                        )}
                    </div>
                    {canWithdraw && (
                        <WithdrawButton applicationId={application.id} locale={locale} />
                    )}
                </aside>
            </div>
        </div>
    );
}
