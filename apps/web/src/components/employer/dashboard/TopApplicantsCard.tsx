import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { ApplicantCardView } from '@/lib/api/hooks/employer';

type Props = {
    locale: string;
    applicants: ApplicantCardView[];
};

export async function TopApplicantsCard({ locale, applicants }: Props) {
    const t = await getTranslations({ locale, namespace: 'employer.dashboard.top_applicants' });

    const newOnes = applicants
        .filter((a) => a.status === 'applied')
        .sort((a, b) => b.worker.skillsMatchCount - a.worker.skillsMatchCount)
        .slice(0, 4);

    const newCount = applicants.filter((a) => a.status === 'applied').length;

    return (
        <div className="bg-base-100 border-base-300 overflow-hidden rounded-2xl border">
            <div className="border-base-300 flex items-center justify-between border-b px-4 py-3">
                <h2 className="font-display text-base font-light tracking-tight">{t('title')}</h2>
                <span
                    className={[
                        'rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider',
                        newCount > 0
                            ? 'bg-accent text-accent-content'
                            : 'bg-base-200 text-base-content/50',
                    ].join(' ')}
                >
                    {newCount} {t('new')}
                </span>
            </div>
            {newOnes.length === 0 && (
                <div className="text-base-content/60 px-4 py-6 text-center text-xs">{t('empty')}</div>
            )}
            {newOnes.map((a, i) => (
                <Link
                    key={a.id}
                    href={`/${locale}/employer/applications/${a.id}`}
                    className={[
                        'hover:bg-base-200 flex items-center gap-2.5 px-4 py-3 transition-colors',
                        i < newOnes.length - 1 ? 'border-base-300 border-b' : '',
                    ].join(' ')}
                >
                    <div className="bg-base-200 text-base-content/80 grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-xs font-bold">
                        {(a.worker.firstName[0] ?? '').toUpperCase()}
                        {a.worker.lastInitial.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">
                            {a.worker.firstName} {a.worker.lastInitial}.
                        </div>
                        <div className="text-base-content/60 truncate text-xs">
                            {locale === 'es' ? a.job.titleEs : a.job.titleEn}
                            {a.worker.certifications[0] ? ` · ${a.worker.certifications[0].name}` : ''}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-primary font-mono text-sm font-bold">
                            {a.worker.skillsMatchCount}
                        </div>
                        <div className="text-base-content/60 text-[10px]">{t('match')}</div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
