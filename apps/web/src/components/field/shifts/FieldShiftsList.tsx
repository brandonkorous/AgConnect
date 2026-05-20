'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import type { ShiftRow } from '@/lib/api/me';

type Buckets = {
    today: ShiftRow[];
    upcoming: ShiftRow[];
    past: ShiftRow[];
};

type Props = {
    locale: string;
    buckets: Buckets;
};

export function FieldShiftsList({ locale, buckets }: Props) {
    const t = useTranslations('worker.field.shifts');
    const formatter = useFormatter();
    const total = buckets.today.length + buckets.upcoming.length + buckets.past.length;

    if (total === 0) {
        return (
            <div className="bg-base-100 border-base-300 rounded-2xl border px-5 py-6 text-center">
                <span className="bg-base-200 text-base-content/70 mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full">
                    <FontAwesomeIcon icon={faCalendarDays} className="h-5 w-5" aria-hidden />
                </span>
                <h2 className="text-base-content text-xl font-semibold">{t('empty.title')}</h2>
                <p className="text-base-content/65 mx-auto mt-1.5 max-w-xs text-sm">
                    {t('empty.body')}
                </p>
            </div>
        );
    }

    const localized = (row: ShiftRow): string => {
        const title =
            (locale === 'es' ? row.shift.jobTitleEs : row.shift.jobTitleEn) ??
            row.shift.jobTitleEn ??
            row.shift.jobTitleEs;
        return title || row.shift.crewName || row.shift.employer;
    };

    function statusTone(s: ShiftRow['status']): string {
        switch (s) {
            case 'confirmed':
                return 'bg-success/15 text-success';
            case 'declined':
            case 'no_show':
                return 'bg-error/10 text-error';
            case 'attended':
                return 'bg-base-200 text-base-content/70';
            default:
                return 'bg-warning/15 text-warning';
        }
    }

    // The API returns `'attended'` for completed assignments while the seed
    // bundle uses `'completed'` for the human label — translate the wire
    // value to the bundle key here so neither side has to compromise.
    function statusLabel(s: ShiftRow['status']): string {
        const key = s === 'attended' ? 'completed' : s;
        return t(`status.${key}`);
    }

    // Date strings are bare 'YYYY-MM-DD' — anchor to noon to avoid the
    // local-midnight back-dating that bites when the runtime TZ is east of
    // where the shift was scheduled. Helper picks one of three formats based
    // on the bucket so the inline-options stays inside the formatter overload
    // that next-intl exposes (its `Parameters<>` resolves to the string-format
    // overload, which would lose the options-only signature).
    function fmtDate(iso: string, bucket: 'today' | 'upcoming' | 'past'): string {
        const d = new Date(`${iso}T12:00:00`);
        if (bucket === 'today') return formatter.dateTime(d, { weekday: 'long' });
        if (bucket === 'upcoming')
            return formatter.dateTime(d, { weekday: 'short', month: 'short', day: 'numeric' });
        return formatter.dateTime(d, { month: 'short', day: 'numeric' });
    }

    function fmtTime(hhmm: string): string {
        const parts = hhmm.split(':');
        const h = parts[0] ? parseInt(parts[0], 10) : NaN;
        const m = parts[1] ? parseInt(parts[1], 10) : NaN;
        if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return formatter.dateTime(d, { hour: 'numeric', minute: '2-digit' });
    }

    return (
        <div className="space-y-5">
            {buckets.today.length > 0 && (
                <Section title={t('section_today')}>
                    {buckets.today.map((row) => (
                        <ShiftLine
                            key={row.id}
                            row={row}
                            title={localized(row)}
                            statusLabel={statusLabel(row.status)}
                            statusToneClass={statusTone(row.status)}
                            dateLabel={fmtDate(row.shift.date, 'today')}
                            timeLabel={fmtTime(row.shift.startTime)}
                        />
                    ))}
                </Section>
            )}
            {buckets.upcoming.length > 0 && (
                <Section title={t('section_upcoming')}>
                    {buckets.upcoming.map((row) => (
                        <ShiftLine
                            key={row.id}
                            row={row}
                            title={localized(row)}
                            statusLabel={statusLabel(row.status)}
                            statusToneClass={statusTone(row.status)}
                            dateLabel={fmtDate(row.shift.date, 'upcoming')}
                            timeLabel={fmtTime(row.shift.startTime)}
                        />
                    ))}
                </Section>
            )}
            {buckets.past.length > 0 && (
                <Section title={t('section_past')}>
                    {buckets.past.map((row) => (
                        <ShiftLine
                            key={row.id}
                            row={row}
                            title={localized(row)}
                            statusLabel={statusLabel(row.status)}
                            statusToneClass={statusTone(row.status)}
                            dateLabel={fmtDate(row.shift.date, 'past')}
                            timeLabel={fmtTime(row.shift.startTime)}
                            dim
                        />
                    ))}
                </Section>
            )}
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-2">
            <h2 className="text-base-content/55 px-1 font-mono text-xs uppercase tracking-wide">
                {title}
            </h2>
            <ul className="space-y-2">{children}</ul>
        </section>
    );
}

type LineProps = {
    row: ShiftRow;
    title: string;
    dateLabel: string;
    timeLabel: string;
    statusLabel: string;
    statusToneClass: string;
    dim?: boolean;
};

function ShiftLine({ row, title, dateLabel, timeLabel, statusLabel, statusToneClass, dim }: LineProps) {
    return (
        <li
            className={[
                'bg-base-100 border-base-300 flex items-start gap-3 rounded-2xl border px-4 py-3.5',
                dim ? 'opacity-75' : '',
            ].join(' ')}
        >
            <div className="min-w-0 flex-1">
                <p className="text-base-content text-base font-semibold leading-tight">
                    {title}
                </p>
                <p className="text-base-content/65 mt-0.5 truncate text-xs">
                    {row.shift.crewName ? `${row.shift.crewName} · ${row.shift.employer}` : row.shift.employer}
                </p>
                <p className="text-base-content/55 mt-1.5 flex items-center gap-1 text-xs">
                    <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" aria-hidden />
                    <span className="truncate">{row.shift.locationLabel}</span>
                </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="text-base-content text-sm font-bold tabular-nums slashed-zero">
                    {timeLabel}
                </span>
                <span className="text-base-content/55 text-[10px] uppercase tracking-wide">
                    {dateLabel}
                </span>
                <span
                    className={[
                        'mt-0.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase',
                        statusToneClass,
                    ].join(' ')}
                >
                    {statusLabel}
                </span>
            </div>
        </li>
    );
}
