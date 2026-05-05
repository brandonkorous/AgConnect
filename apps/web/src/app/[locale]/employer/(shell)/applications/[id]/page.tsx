import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { listInbox } from '@/lib/api/employer';
import { ApplicantActions } from '@/components/employer/ApplicantActions';

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function ApplicantDetailPage({ params }: Props) {
    const { locale, id } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.applicant_detail' });

    const apps = await listInbox();
    const app = apps.find((a) => a.id === id);
    if (!app) notFound();

    return (
        <div className=" px-5 pb-16 pt-8">
            <Link
                href={`/${locale}/employer/inbox`}
                className="text-base-content/60 hover:text-base-content mb-6 inline-flex items-center text-sm"
            >
                <FontAwesomeIcon icon={faChevronLeft} className="mr-2 h-3 w-3" />
                {t('back')}
            </Link>

            <div className="bg-base-100 border-base-300 rounded-2xl border p-6">
                <div className="flex items-start gap-4">
                    <div className="bg-primary text-primary-content grid h-14 w-14 place-items-center rounded-full text-base font-bold">
                        {app.worker.firstName[0]}
                        {app.worker.lastInitial}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="font-display text-4xl font-light leading-tight tracking-tight md:text-5xl">
                            {app.worker.firstName} {app.worker.lastInitial}.
                        </h1>
                        <p className="text-base-content/70 text-sm">{app.worker.county}</p>
                        <p className="text-base-content/60 text-xs mt-1">
                            {locale === 'es' ? app.job.titleEs : app.job.titleEn}
                        </p>
                    </div>
                </div>

                <div className="mt-6">
                    <h2 className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
                        {t('skills')} ({t('skills_match', { count: app.worker.skillsMatchCount })})
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {app.worker.skills.map((s) => (
                            <span key={s} className="badge badge-ghost">
                                {s}
                            </span>
                        ))}
                    </div>
                </div>

                {app.worker.certifications.length > 0 && (
                    <div className="mt-6">
                        <h2 className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
                            {t('certifications')}
                        </h2>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {app.worker.certifications.map((c) => (
                                <span
                                    key={c.name}
                                    className={[
                                        'badge',
                                        c.source === 'agconn' ? 'badge-primary badge-outline' : 'badge-ghost',
                                    ].join(' ')}
                                >
                                    {c.name} · {c.source === 'agconn' ? t('agconn_verified') : t('self_reported')}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <ApplicantActions
                    locale={locale}
                    applicationId={app.id}
                    currentStatus={app.status}
                    workerName={`${app.worker.firstName} ${app.worker.lastInitial}.`}
                    jobTitle={locale === 'es' ? app.job.titleEs : app.job.titleEn}
                />
            </div>
        </div>
    );
}
