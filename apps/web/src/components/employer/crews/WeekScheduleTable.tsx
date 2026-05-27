import type { Route } from 'next';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import type { useTranslations } from 'next-intl';
import type { CrewView, ShiftView } from '@/lib/api/hooks/employer-ops';
import { CrewEditTrigger } from './CrewEditTrigger';
import { ShiftEditTrigger } from './ShiftEditTrigger';

type T = ReturnType<typeof useTranslations>;

export function WeekScheduleTable({
    crews,
    days,
    shiftsByCrewByDate,
    locale,
    isCurrentWeek,
    t,
}: {
    crews: CrewView[];
    days: Date[];
    shiftsByCrewByDate: Map<string, Map<string, ShiftView>>;
    locale: string;
    isCurrentWeek: boolean;
    t: T;
}) {
    return (
        <section className="bg-base-100 border-base-300 mb-7 overflow-x-auto rounded-2xl border">
            <table className="table table-zebra table-pin-cols table-sm w-full">
                <thead>
                    <tr>
                        <th className="bg-base-200 text-base-content/60 font-mono text-xs font-bold uppercase tracking-wider">
                            {t('header_label')}
                        </th>
                        {days.map((d, i) => (
                            <td
                                key={i}
                                className={[
                                    'align-top',
                                    i === 0 && isCurrentWeek ? 'bg-primary/10' : 'bg-base-200',
                                ].join(' ')}
                            >
                                <div className="text-base-content/60 font-mono text-[10px] font-bold uppercase tracking-wider">
                                    {weekday(d, locale)}
                                </div>
                                <div className="font-display mt-0.5 text-xl font-light tracking-tight">
                                    {monthDay(d, locale)}
                                </div>
                            </td>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {crews.map((cr) => (
                        <tr key={cr.id}>
                            <th className="align-top">
                                <CrewEditTrigger
                                    crew={cr}
                                    ariaLabel={t('row_edit_aria', { crew: cr.name })}
                                    className="hover:bg-base-200/40 group block w-full text-left"
                                >
                                    <div className="text-sm font-semibold leading-tight">{cr.name}</div>
                                    <div className="text-base-content/60 mt-1 text-xs font-normal">
                                        {cr.foremanName ?? t('no_foreman')} · {cr.memberCount} {t('crew_size_short')}
                                    </div>
                                    {cr.jobTitle && (
                                        <div className="text-base-content/50 mt-0.5 text-xs font-normal">{cr.jobTitle}</div>
                                    )}
                                </CrewEditTrigger>
                            </th>
                            {days.map((d, di) => {
                                const dateStr = d.toISOString().slice(0, 10);
                                const slot = shiftsByCrewByDate.get(cr.id)?.get(dateStr) ?? null;
                                return (
                                    <td
                                        key={di}
                                        className={['align-top', di === 0 && isCurrentWeek ? 'bg-primary/5' : ''].join(' ')}
                                    >
                                        {slot ? (
                                            <ShiftEditTrigger
                                                shift={slot}
                                                locale={locale}
                                                ariaLabel={t('cell_edit_aria', { date: dateStr })}
                                                className="text-left"
                                            >
                                                <ShiftCell shift={slot} t={t} />
                                            </ShiftEditTrigger>
                                        ) : (
                                            <Link
                                                href={
                                                    `/${locale}/employer/crews/new-shift?crewId=${cr.id}&date=${dateStr}` as Route
                                                }
                                                aria-label={t('cell_new_aria', { date: dateStr })}
                                                className="border-base-300 hover:border-base-content/40 hover:bg-base-200 text-base-content/40 hover:text-base-content/70 grid h-full min-h-[60px] place-items-center rounded-lg border border-dashed text-xs transition"
                                            >
                                                {t('cell_off')}
                                            </Link>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}

function ShiftCell({ shift, t }: { shift: ShiftView; t: T }) {
    const isCancelled = shift.status === 'cancelled';
    const isPending = !isCancelled && shift.confirmedCount < shift.assignedCount;
    const tone = isCancelled
        ? { bg: 'bg-base-200/60', body: 'text-base-content/55', time: 'text-base-content/70', bar: 'border-l-base-content/30' }
        : isPending
            ? { bg: 'bg-warning/10', body: 'text-base-content/80', time: 'text-warning', bar: 'border-l-warning' }
            : { bg: 'bg-primary/10', body: 'text-base-content/80', time: 'text-primary', bar: 'border-l-primary' };

    return (
        <div
            className={[
                'rounded-lg border-l-4 p-2.5 transition',
                tone.bg,
                tone.body,
                tone.bar,
                'group-hover:brightness-[0.97]',
            ].join(' ')}
        >
            <div className="flex items-baseline justify-between gap-1">
                <div className={`text-xs font-bold tabular-nums ${tone.time}`}>
                    {shift.startTime}
                    {shift.endTime ? `–${shift.endTime}` : ''}
                </div>
                {isCancelled && (
                    <span className="text-[9px] font-mono uppercase tracking-wider opacity-70">
                        {t('cell_cancelled_pill')}
                    </span>
                )}
            </div>
            <div className="mt-0.5 truncate text-xs">{shift.locationLabel}</div>
            <div className="mt-1.5 flex items-start gap-1 font-mono text-[10px] leading-tight tabular-nums">
                <FontAwesomeIcon icon={faUsers} className="mt-0.5 h-2.5 w-2.5 shrink-0" />
                <span className="min-w-0 break-words">
                    {shift.confirmedCount}/{shift.assignedCount}{' '}
                    {isCancelled
                        ? t('cell_cancelled_suffix')
                        : isPending
                            ? t('cell_pending_suffix')
                            : t('cell_confirmed_suffix')}
                </span>
            </div>
        </div>
    );
}

function weekday(d: Date, locale: string): string {
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        weekday: 'short',
        timeZone: 'UTC',
    }).format(d);
}

function monthDay(d: Date, locale: string): string {
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
    }).format(d);
}
