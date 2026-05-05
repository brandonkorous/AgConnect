import { useFormatter, useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faLocationDot,
    faDiamondTurnRight,
    faPhone,
    faClipboardList,
} from '@fortawesome/free-solid-svg-icons';
import type { ShiftRow } from '@/lib/api/me';

type Props = {
    row: ShiftRow;
    locale: string;
};

function buildMapsHref(row: ShiftRow): string {
    const { locationLat, locationLng, locationLabel } = row.shift;
    if (locationLat != null && locationLng != null) {
        return `https://www.google.com/maps/dir/?api=1&destination=${locationLat},${locationLng}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locationLabel)}`;
}

function formatTimeRange(start: string, end: string | null, formatter: ReturnType<typeof useFormatter>): string {
    const fmt = (hhmm: string) => {
        const parts = hhmm.split(':');
        const h = parts[0] ? parseInt(parts[0], 10) : NaN;
        const m = parts[1] ? parseInt(parts[1], 10) : NaN;
        if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return formatter.dateTime(d, { hour: 'numeric', minute: '2-digit' });
    };
    return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

export function ShiftCard({ row, locale }: Props) {
    const t = useTranslations('worker.field.today');
    const formatter = useFormatter();
    const jobTitle =
        (locale === 'es' ? row.shift.jobTitleEs : row.shift.jobTitleEn) ??
        row.shift.jobTitleEn ??
        row.shift.jobTitleEs ??
        t('untitled_job');

    return (
        <article className="bg-base-100 border-base-300 overflow-hidden rounded-2xl border">
            <header className="border-base-300 border-b px-5 py-4">
                <p className="text-base-content/55 mb-1 font-mono text-[11px] uppercase tracking-wide">
                    {t('eyebrow')}
                </p>
                <p className="text-base-content text-3xl font-bold tabular-nums slashed-zero">
                    {formatTimeRange(row.shift.startTime, row.shift.endTime, formatter)}
                </p>
                <h1 className="text-base-content mt-2 text-xl font-semibold leading-tight">
                    {jobTitle}
                </h1>
                <p className="text-base-content/70 mt-1 text-sm">
                    {row.shift.crewName
                        ? t('crew_at_employer', { crew: row.shift.crewName, employer: row.shift.employer })
                        : row.shift.employer}
                </p>
            </header>

            <div className="border-base-300 flex items-start gap-3 border-b px-5 py-4">
                <FontAwesomeIcon
                    icon={faLocationDot}
                    className="text-base-content/55 mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden
                />
                <div className="min-w-0 flex-1">
                    <p className="text-base-content/55 mb-1 font-mono text-[10px] uppercase tracking-wide">
                        {t('where')}
                    </p>
                    <p className="text-base-content text-base font-medium">
                        {row.shift.locationLabel}
                    </p>
                </div>
            </div>

            <a
                href={buildMapsHref(row)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-primary-content active:bg-primary/90 flex h-[60px] items-center justify-center gap-2 text-base font-semibold transition-colors"
            >
                <FontAwesomeIcon icon={faDiamondTurnRight} className="h-4 w-4" aria-hidden />
                {t('get_directions')}
            </a>

            {row.shift.foremanPhone && (
                <a
                    href={`tel:${row.shift.foremanPhone}`}
                    className="bg-base-200 text-base-content active:bg-base-300 border-base-300 flex h-[60px] items-center justify-center gap-2 border-t text-base font-semibold transition-colors"
                >
                    <FontAwesomeIcon icon={faPhone} className="h-4 w-4" aria-hidden />
                    {t('call_supervisor')}
                </a>
            )}

            {row.shift.notes && (
                <div className="border-base-300 border-t px-5 py-4">
                    <p className="text-base-content/55 mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide">
                        <FontAwesomeIcon icon={faClipboardList} className="h-3 w-3" aria-hidden />
                        {t('what_to_bring')}
                    </p>
                    <p className="text-base-content/85 text-sm leading-relaxed whitespace-pre-line">
                        {row.shift.notes}
                    </p>
                </div>
            )}
        </article>
    );
}
