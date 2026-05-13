import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { fetchTrainingPrograms } from '@/lib/api/training';

type Props = { locale: string };

function formatDuration(start: string, end: string, locale: string): string {
    const a = new Date(start);
    const b = new Date(end);
    const days = Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000));
    if (days <= 13) {
        return locale === 'es' ? `${days} días` : `${days} days`;
    }
    const weeks = Math.round(days / 7);
    return locale === 'es' ? `${weeks} semanas` : `${weeks} weeks`;
}

export async function TrainingNudge({ locale }: Props) {
    const t = await getTranslations({ locale, namespace: 'worker.dashboard.training' });
    const { programs } = await fetchTrainingPrograms({
        hasCapacity: true,
        limit: 1,
    });
    const top = programs[0];

    if (!top) {
        return (
            <section className="bg-base-100 border-base-300 rounded-2xl border p-4">
                <div className="mb-3 flex items-center gap-2.5">
                    <FontAwesomeIcon icon={faGraduationCap} className="text-primary h-4 w-4" />
                    <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-base-content/60">
                        {t('eyebrow')}
                    </span>
                </div>
                <p className="text-base-content/70 text-sm">
                    {locale === 'es'
                        ? 'No hay programas de capacitación abiertos en este momento.'
                        : 'No open training programs in your area right now.'}
                </p>
                <Link
                    href={`/${locale}/worker/training`}
                    className="text-primary mt-3 inline-flex items-center gap-1 text-xs font-bold no-underline hover:underline"
                >
                    {locale === 'es' ? 'Ver capacitaciones' : 'Browse training'}
                    <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                </Link>
            </section>
        );
    }

    const title = (locale === 'es' ? top.titleEs : top.titleEn) || top.titleEn;
    const meta = `${formatDuration(top.startDate, top.endDate, locale)} · ${top.county} · ${top.funder}`;

    return (
        <section className="bg-base-100 border-base-300 rounded-2xl border p-4">
            <div className="mb-3 flex items-center gap-2.5">
                <FontAwesomeIcon icon={faGraduationCap} className="text-primary h-4 w-4" />
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-base-content/60">
                    {t('eyebrow')}
                </span>
            </div>
            <p className="font-serif text-lg font-medium leading-snug tracking-tight">
                {title}
            </p>
            <p className="text-base-content/60 mt-2 text-xs">{meta}</p>
            <Link
                href={`/${locale}/worker/training/${top.seoSlug}`}
                className="btn btn-neutral btn-sm mt-3.5"
            >
                {t('enroll')}
                <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
            </Link>
        </section>
    );
}
