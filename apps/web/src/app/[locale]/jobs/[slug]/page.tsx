import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faLocationDot,
    faCalendarDays,
    faHouse,
    faVanShuttle,
} from '@fortawesome/free-solid-svg-icons';
import { Pill } from '@/components/worker/primitives/Pill';
import { CropGlyph } from '@/components/jobs/CropGlyph';
import { fetchPublicJob } from '@/lib/api/public-jobs';
import { inferCrop } from '@/lib/crop';
import { PublicShell } from '@/components/public/PublicShell';
import { getSmsApplyNumber, getSmsApplyKeyword } from '@/lib/sms-apply';

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale, slug } = await params;
    const job = await fetchPublicJob(slug);
    if (!job) return { title: 'Job' };
    const title = locale === 'es' ? job.titleEs : job.titleEn;
    const description =
        (locale === 'es' ? job.descriptionEs : job.descriptionEn).slice(0, 160) ||
        `${job.employerName} hiring ${title} in ${job.county} County, CA. $${job.wageMin}–${job.wageMax}/${job.wageUnit}.`;
    return {
        title,
        description,
        alternates: {
            canonical: `/${locale}/jobs/${slug}`,
            languages: { en: `/en/jobs/${slug}`, es: `/es/jobs/${slug}` },
        },
        openGraph: {
            title,
            description,
            type: 'website',
            url: `/${locale}/jobs/${slug}`,
        },
    };
}

export default async function PublicJobDetailPage({ params }: Props) {
    const { locale, slug } = await params;
    const t = await getTranslations({ locale, namespace: 'public_jobs.detail' });
    const job = await fetchPublicJob(slug);
    if (!job) notFound();
    const title = locale === 'es' ? job.titleEs : job.titleEn;
    const description = locale === 'es' ? job.descriptionEs : job.descriptionEn;
    const crop = inferCrop(job.titleEn, job.skills);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const jobPostingJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title,
        description: description || `${job.employerName} hiring ${title}.`,
        datePosted: job.publishedAt ?? job.createdAt,
        validThrough: job.applyBy ?? undefined,
        employmentType: 'SEASONAL',
        hiringOrganization: { '@type': 'Organization', name: job.employerName },
        jobLocation: {
            '@type': 'Place',
            address: {
                '@type': 'PostalAddress',
                addressRegion: 'CA',
                addressCountry: 'US',
                addressLocality: job.city ?? `${job.county} County`,
            },
        },
        baseSalary: {
            '@type': 'MonetaryAmount',
            currency: 'USD',
            value: {
                '@type': 'QuantitativeValue',
                minValue: job.wageMin,
                maxValue: job.wageMax,
                unitText: job.wageUnit.toUpperCase(),
            },
        },
        industry: 'Agriculture',
        jobBenefits: [
            job.housing ? 'Housing provided' : null,
            job.transport ? 'Transportation provided' : null,
        ]
            .filter(Boolean)
            .join(', ') || undefined,
        url: `${siteUrl}/${locale}/jobs/${slug}`,
    };

    return (
        <PublicShell locale={locale} title={title}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd) }}
            />
            <Link
                href={`/${locale}/jobs`}
                className="text-base-content/70 hover:text-base-content -mt-2 mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium"
            >
                <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
                {t('back')}
            </Link>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
                <div>
                    <div className="flex items-start gap-4">
                        <div className="bg-base-200 grid h-14 w-14 shrink-0 place-items-center rounded-2xl">
                            <CropGlyph crop={crop} size={32} />
                        </div>
                        <div className="min-w-0 flex-1">
                            {job.employerVerified && <Pill tone="primary">{t('verified')}</Pill>}
                            <h1 className="font-serif mt-2 text-[32px] font-normal leading-tight tracking-[-0.025em] sm:text-[40px]">
                                {title}
                            </h1>
                            <div className="text-base-content/70 mt-2 flex flex-wrap items-center gap-3 text-[13.5px]">
                                <span className="inline-flex items-center gap-1.5">
                                    <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" />
                                    {job.city ? `${job.city}, ${job.county}` : `${job.county} County`}
                                </span>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1.5">
                                    <FontAwesomeIcon icon={faCalendarDays} className="h-3 w-3" />
                                    {t('starts_on', { date: job.startDate })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="border-base-300 bg-base-100 mt-6 grid gap-1 rounded-2xl border p-5">
                        <div className="text-base-content/60 font-mono text-xs font-semibold uppercase tracking-[0.18em]">
                            {t('wage_label')}
                        </div>
                        <div className="font-serif text-primary text-[40px] leading-none tracking-[-0.025em]">
                            ${job.wageMin}–${job.wageMax}
                        </div>
                        <div className="text-base-content/60 mt-1 text-[12px]">/{job.wageUnit}</div>
                    </div>

                    <div className="mt-6">
                        <h2 className="font-serif mb-3 text-[20px] tracking-[-0.02em]">
                            {t('about')}
                        </h2>
                        <p className="text-base-content/80 whitespace-pre-line text-[14.5px] leading-relaxed">
                            {description}
                        </p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                        {job.housing && (
                            <span className="border-base-300 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px]">
                                <FontAwesomeIcon icon={faHouse} className="h-3 w-3" />
                                {t('housing')}
                            </span>
                        )}
                        {job.transport && (
                            <span className="border-base-300 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px]">
                                <FontAwesomeIcon icon={faVanShuttle} className="h-3 w-3" />
                                {t('transport')}
                            </span>
                        )}
                    </div>
                </div>

                <aside className="grid gap-3.5 self-start">
                    <div className="border-base-300 bg-base-100 grid gap-3 rounded-2xl border p-5">
                        <Link
                            href={`/${locale}/sign-up?redirect_url=${encodeURIComponent(`/${locale}/worker/jobs/${slug}`)}` as Route}
                            className="btn btn-primary btn-lg w-full no-underline"
                        >
                            {t('apply_cta')}
                        </Link>
                        <div className="text-base-content/60 text-center text-[11.5px]">
                            {t('signin_note')}
                        </div>
                        {getSmsApplyNumber() && (
                            <div className="border-base-300 mt-2 border-t pt-3 text-center">
                                <div className="text-base-content/60 font-mono text-xs uppercase tracking-[0.18em]">
                                    {t('sms_label')}
                                </div>
                                <div className="text-base-content mt-1 font-mono text-[15px] font-bold">
                                    {getSmsApplyKeyword()} → {getSmsApplyNumber()}
                                </div>
                            </div>
                        )}
                    </div>
                    {job.applyBy && (
                        <div className="border-base-300 bg-base-100 grid gap-1 rounded-2xl border p-5">
                            <div className="text-base-content/60 font-mono text-xs font-semibold uppercase tracking-[0.18em]">
                                {t('apply_by_label')}
                            </div>
                            <div className="font-serif text-[24px] tracking-[-0.025em]">
                                {job.applyBy}
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </PublicShell>
    );
}
