import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faLocationDot,
    faSackDollar,
    faUsers,
    faCalendarPlus,
} from '@fortawesome/free-solid-svg-icons';
import { fetchMyShifts, type ShiftRow } from '@/lib/api/me';
import { UpNextActions } from './UpNextActions';

type Props = { locale: string };

function formatShiftEyebrow(iso: string, locale: string): string {
    const d = new Date(iso);
    const fmt = new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        weekday: 'long',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
    return fmt.format(d).replace(',', ' ·');
}

function pickNextShift(shifts: ShiftRow[]): ShiftRow | null {
    const now = Date.now();
    const upcoming = shifts
        .filter((s) => new Date(s.shift.startTime).getTime() >= now - 4 * 60 * 60 * 1000)
        .sort(
            (a, b) =>
                new Date(a.shift.startTime).getTime() -
                new Date(b.shift.startTime).getTime(),
        );
    return upcoming[0] ?? null;
}

export async function UpNextShift({ locale }: Props) {
    const t = await getTranslations({ locale, namespace: 'worker.dashboard.up_next' });
    const shifts = await fetchMyShifts();
    const next = pickNextShift(shifts);

    if (!next) {
        return (
            <section className="bg-neutral text-neutral-content relative mb-7 overflow-hidden rounded-3xl p-6">
                <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(ellipse 60% 100% at 100% 0%, oklch(83% 0.13 88 / 0.18), transparent 60%)',
                    }}
                />
                <div className="relative">
                    <div className="text-accent font-mono text-xs font-semibold uppercase tracking-[0.18em]">
                        {t('empty_eyebrow')}
                    </div>
                    <h2 className="font-serif mt-2 max-w-xl text-2xl font-medium leading-snug tracking-tight md:text-3xl">
                        {t('empty_title')}
                    </h2>
                    <Link
                        href={`/${locale}/worker/jobs`}
                        className="btn btn-accent btn-sm mt-5"
                    >
                        <FontAwesomeIcon icon={faCalendarPlus} className="h-3 w-3" />
                        {t('browse_cta')}
                    </Link>
                </div>
            </section>
        );
    }

    const titleEn = next.shift.jobTitleEn;
    const titleEs = next.shift.jobTitleEs;
    const title =
        (locale === 'es' ? titleEs : titleEn) ||
        titleEn ||
        titleEs ||
        next.shift.crewName ||
        next.shift.employer;
    const isConfirmed = next.status === 'confirmed' || next.status === 'attended';
    const isDeclined = next.status === 'declined';
    const eyebrowText = isDeclined
        ? t('declined_eyebrow')
        : isConfirmed
            ? t('confirmed_eyebrow')
            : formatShiftEyebrow(next.shift.startTime, locale);

    return (
        <section className="bg-neutral text-neutral-content relative mb-7 overflow-hidden rounded-3xl p-6">
            <div
                aria-hidden
                className="absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse 60% 100% at 100% 0%, oklch(83% 0.13 88 / 0.28), transparent 60%)',
                }}
            />
            <div className="relative flex flex-wrap items-center justify-between gap-8">
                <div className="min-w-0 flex-1">
                    <div className="text-accent font-mono text-xs font-semibold uppercase tracking-[0.18em]">
                        {eyebrowText}
                    </div>
                    <h2 className="font-serif mt-2 text-3xl font-medium leading-[1.05] tracking-tight md:text-4xl">
                        {title}
                    </h2>
                    <ul className="mt-3.5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-neutral-content/75">
                        <li className="inline-flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faLocationDot} className="h-3.5 w-3.5" />
                            {next.shift.locationLabel}
                        </li>
                        {next.shift.crewName && (
                            <li className="inline-flex items-center gap-1.5">
                                <FontAwesomeIcon icon={faUsers} className="h-3.5 w-3.5" />
                                {next.shift.crewName}
                            </li>
                        )}
                        {next.shift.employer && (
                            <li className="inline-flex items-center gap-1.5">
                                <FontAwesomeIcon icon={faSackDollar} className="h-3.5 w-3.5" />
                                {next.shift.employer}
                            </li>
                        )}
                    </ul>
                    <UpNextActions
                        assignmentId={next.id}
                        status={next.status}
                        locale={locale}
                        directionsUrl={
                            next.shift.locationLat && next.shift.locationLng
                                ? `https://www.google.com/maps/dir/?api=1&destination=${next.shift.locationLat},${next.shift.locationLng}`
                                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(next.shift.locationLabel)}`
                        }
                        labels={{
                            confirm: t('confirm'),
                            decline: t('decline'),
                            directions: t('directions'),
                            error: t('confirm_error'),
                        }}
                    />
                </div>
            </div>
        </section>
    );
}
