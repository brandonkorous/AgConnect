import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import {
    getWorkerDetail,
    listEmployerJobs,
    getEmployerProfile,
    verificationStatus,
} from '@/lib/api/employer';
import { InviteWorkerButton } from '@/components/employer/workers/InviteWorkerButton';
import { LockedCard } from '@/components/employer/primitives';

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function WorkerPreviewPage({ params }: Props) {
    const { locale, id } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.workers' });

    const profile = await getEmployerProfile();
    const isProPlus = profile?.plan === 'pro' || profile?.plan === 'enterprise';
    if (!isProPlus) {
        const vStatus = profile ? verificationStatus(profile) : 'pending';
        const verificationPending = vStatus === 'pending' || vStatus === 'rejected';
        return (
            <div className=" px-5 pb-16 pt-8">
                <LockedCard
                    title={t('plan_gate.title')}
                    description={t('plan_gate.body')}
                    cta={{
                        label: t('plan_gate.upgrade'),
                        href: `/${locale}/employer/billing`,
                    }}
                    hint={verificationPending ? t('plan_gate.verification_hint') : undefined}
                />
            </div>
        );
    }

    const [worker, jobs] = await Promise.all([getWorkerDetail(id), listEmployerJobs()]);
    if (!worker) notFound();

    const activeJobs = jobs.filter((j) => j.status === 'active');
    const alreadyInvited = worker.relationship === 'invited' || worker.relationship === 'hired';

    return (
        <div className=" px-5 pb-16 pt-8">
            <Link
                href={`/${locale}/employer/workers`}
                className="text-base-content/60 hover:text-base-content mb-6 inline-block text-sm"
            >
                ← {t('title')}
            </Link>
            <div className="bg-base-100 border-base-300 rounded-2xl border p-6">
                <div className="flex items-start gap-4">
                    <div className="bg-primary text-primary-content grid h-14 w-14 place-items-center rounded-full text-base font-bold">
                        {(worker.firstName[0] ?? '').toUpperCase()}
                        {worker.lastInitial.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="font-display text-3xl font-light">
                            {worker.firstName} {worker.lastInitial}.
                        </h1>
                        <p className="text-base-content/70 text-sm">{worker.county ?? '—'}</p>
                        {worker.relationship && (
                            <span className="bg-success/15 text-success mt-2 inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">
                                {t(`relationship.${worker.relationship}`)}
                            </span>
                        )}
                    </div>
                    <InviteWorkerButton
                        workerId={worker.id}
                        workerFirstName={worker.firstName}
                        jobs={activeJobs.map((j) => ({ id: j.id, titleEn: j.titleEn, titleEs: j.titleEs }))}
                        variant="detail"
                        alreadyInvited={alreadyInvited}
                    />
                </div>

                <Section heading={t('preview.skills')}>
                    <div className="flex flex-wrap gap-2">
                        {worker.skills.map((s) => (
                            <span key={s} className="bg-base-200 rounded-full px-3 py-1 text-xs">
                                {s}
                            </span>
                        ))}
                        {worker.skills.length === 0 && (
                            <span className="text-base-content/50 text-xs">—</span>
                        )}
                    </div>
                </Section>

                <Section heading={t('preview.experience')}>
                    <ul className="text-sm">
                        {worker.experience.length === 0 && (
                            <li className="text-base-content/50 py-2 text-xs">—</li>
                        )}
                        {worker.experience.map((rawEntry, idx) => (
                            <li key={idx} className="border-base-200 border-b py-2 last:border-0">
                                {formatExperience(rawEntry)}
                            </li>
                        ))}
                    </ul>
                </Section>

                <Section heading={t('preview.education')}>
                    <ul className="text-sm">
                        {worker.education.length === 0 && (
                            <li className="text-base-content/50 py-2 text-xs">—</li>
                        )}
                        {worker.education.map((rawEntry, idx) => (
                            <li key={idx} className="border-base-200 border-b py-2 last:border-0">
                                {formatEducation(rawEntry)}
                            </li>
                        ))}
                    </ul>
                </Section>

                <Section heading={t('preview.certifications')}>
                    <div className="flex flex-wrap gap-2">
                        {worker.certifications.length === 0 && (
                            <span className="text-base-content/50 text-xs">—</span>
                        )}
                        {worker.certifications.map((c) => (
                            <span
                                key={c.name}
                                className={[
                                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                                    c.source === 'agconn'
                                        ? 'bg-success/15 text-success'
                                        : 'bg-base-200 text-base-content/80',
                                ].join(' ')}
                            >
                                <FontAwesomeIcon icon={faCircleCheck} className="h-2.5 w-2.5" />
                                {c.name}{' '}
                                <span className="opacity-60 font-mono text-[10px]">
                                    {c.source === 'agconn' ? t('agconn') : t('self')}
                                </span>
                            </span>
                        ))}
                    </div>
                </Section>

                <Section heading={t('preview.languages')}>
                    <div className="flex flex-wrap gap-2">
                        {worker.languages.length === 0 && (
                            <span className="text-base-content/50 text-xs">—</span>
                        )}
                        {worker.languages.map((l) => (
                            <span key={l} className="bg-base-200 rounded-full px-3 py-1 text-xs">
                                {l}
                            </span>
                        ))}
                    </div>
                </Section>
            </div>
        </div>
    );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
    return (
        <div className="mt-6">
            <h2 className="text-base-content/60 font-mono text-xs uppercase tracking-wider">
                {heading}
            </h2>
            <div className="mt-2">{children}</div>
        </div>
    );
}

function formatExperience(raw: unknown): string {
    if (!raw || typeof raw !== 'object') return String(raw ?? '');
    const o = raw as Record<string, unknown>;
    const title = typeof o.title === 'string' ? o.title : '';
    const employer = typeof o.employer === 'string' ? o.employer : '';
    const from = typeof o.from === 'string' ? o.from : '';
    const to = typeof o.to === 'string' ? o.to : '';
    const range = from && to ? `${from}–${to}` : from || to;
    return [title, employer, range].filter(Boolean).join(' · ');
}

function formatEducation(raw: unknown): string {
    if (!raw || typeof raw !== 'object') return String(raw ?? '');
    const o = raw as Record<string, unknown>;
    const title = typeof o.title === 'string' ? o.title : '';
    const year = typeof o.year === 'string' ? o.year : typeof o.year === 'number' ? String(o.year) : '';
    return [title, year].filter(Boolean).join(' · ');
}
