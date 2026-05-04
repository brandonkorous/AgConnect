import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faDownload,
    faComments,
    faUsers,
    faChevronLeft,
    faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import {
    listCrews,
    listShifts,
    startOfWorkWeek,
    type ShiftView,
} from '@/lib/api/employer-ops';
import { NewCrewButton } from '@/components/employer/crews/NewCrewButton';
import { DownloadButton } from '@/components/employer/primitives/DownloadButton';
import { CrewEditTrigger } from '@/components/employer/crews/CrewEditTrigger';
import { ShiftEditTrigger } from '@/components/employer/crews/ShiftEditTrigger';
import { WeekJumper } from '@/components/employer/crews/WeekJumper';

type Props = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ week?: string }>;
};

const WEEK_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.crews' });
    return { title: `AgConn — ${t('title')}` };
}

export default async function CrewsPage({ params, searchParams }: Props) {
    const { locale } = await params;
    const sp = await searchParams;
    const t = await getTranslations({ locale, namespace: 'employer.crews' });

    const anchor = sp.week && WEEK_RE.test(sp.week) ? new Date(`${sp.week}T00:00:00.000Z`) : new Date();
    const weekStart = startOfWorkWeek(anchor);

    const [crews, shifts] = await Promise.all([listCrews(), listShifts({ from: weekStart })]);

    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setUTCDate(weekStart.getUTCDate() + i);
        return d;
    });

    const shiftsByCrewByDate = new Map<string, Map<string, ShiftView>>();
    for (const s of shifts) {
        if (!s.crewId) continue;
        const m = shiftsByCrewByDate.get(s.crewId) ?? new Map<string, ShiftView>();
        m.set(s.shiftDate, s);
        shiftsByCrewByDate.set(s.crewId, m);
    }

    const totals = computeTotals(shifts);
    const weekIso = weekStart.toISOString().slice(0, 10);
    const prevWeek = addDaysIso(weekStart, -7);
    const nextWeek = addDaysIso(weekStart, 7);
    const todayWeekIso = startOfWorkWeek(new Date()).toISOString().slice(0, 10);
    const isCurrentWeek = weekIso === todayWeekIso;
    const basePath = `/${locale}/employer/crews`;

    return (
        <div className="px-5 pb-16 pt-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
                        {t('eyebrow', { date: formatWeekRange(weekStart, locale) })}
                    </p>
                    <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
                        {t('title_a')} <em className="text-primary not-italic font-light">{t('title_b')}</em>
                    </h1>
                    <div className="text-base-content/70 mt-2 text-sm">
                        {t('summary', {
                            crews: crews.length,
                            confirmed: totals.confirmed,
                            filling: totals.filling,
                            hours: totals.hours,
                        })}
                    </div>
                </div>
                <div className="flex gap-2">
                    <DownloadButton
                        path={`/v1/employer/shifts/schedule.csv?from=${weekIso}`}
                        label={t('export')}
                        icon={faDownload}
                        filename={`agconn-schedule-${weekIso}.csv`}
                        variant="pill"
                    />
                    <NewCrewButton />
                    <Link
                        href={`/${locale}/employer/crews/new-shift?date=${weekIso}`}
                        className="btn btn-sm btn-primary rounded-full"
                    >
                        <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                        {t('new_shift_button')}
                    </Link>
                </div>
            </div>

            <nav
                className="text-base-content/70 mb-6 flex flex-wrap items-center gap-3 text-sm"
                aria-label={t('week_nav.aria')}
            >
                <Link
                    href={`${basePath}?week=${prevWeek}` as Route}
                    className="text-base-content/60 hover:text-base-content border-base-300 inline-flex h-8 w-8 items-center justify-center rounded-full border"
                    aria-label={t('week_nav.prev')}
                >
                    <FontAwesomeIcon icon={faChevronLeft} className="h-2.5 w-2.5" />
                </Link>
                <span className="font-display text-lg font-light tracking-tight">
                    {formatWeekRange(weekStart, locale)}
                </span>
                <Link
                    href={`${basePath}?week=${nextWeek}` as Route}
                    className="text-base-content/60 hover:text-base-content border-base-300 inline-flex h-8 w-8 items-center justify-center rounded-full border"
                    aria-label={t('week_nav.next')}
                >
                    <FontAwesomeIcon icon={faChevronRight} className="h-2.5 w-2.5" />
                </Link>
                {!isCurrentWeek && (
                    <Link
                        href={basePath as Route}
                        className="link link-hover text-primary text-xs font-medium"
                    >
                        {t('week_nav.this_week')}
                    </Link>
                )}
                <div className="flex-1" />
                <WeekJumper value={weekIso} basePath={basePath} />
            </nav>

            <section className="bg-base-100 border-base-300 mb-7 overflow-hidden rounded-2xl border">
                <div className="border-base-300 grid grid-cols-[180px_repeat(7,minmax(0,1fr))] border-b">
                    <div className="bg-base-200 border-base-300 text-base-content/60 border-r px-5 py-4 font-mono text-[11px] font-bold uppercase tracking-wider">
                        {t('header_label')}
                    </div>
                    {days.map((d, i) => (
                        <div
                            key={i}
                            className={[
                                'border-base-300 border-r px-4 py-3 last:border-r-0',
                                i === 0 && isCurrentWeek ? 'bg-primary/10' : 'bg-base-200',
                            ].join(' ')}
                        >
                            <div className="text-base-content/60 font-mono text-[10px] font-bold uppercase tracking-wider">
                                {weekday(d, locale)}
                            </div>
                            <div className="font-display mt-0.5 text-xl font-light tracking-tight">
                                {monthDay(d, locale)}
                            </div>
                        </div>
                    ))}
                </div>

                {crews.length === 0 ? (
                    <div className="text-base-content/60 p-8 text-center text-sm">
                        {t('empty_no_crews')}
                    </div>
                ) : (
                    crews.map((cr, ci) => (
                        <div
                            key={cr.id}
                            className={[
                                'grid min-h-[110px] grid-cols-[180px_repeat(7,minmax(0,1fr))]',
                                ci < crews.length - 1 ? 'border-base-300 border-b' : '',
                            ].join(' ')}
                        >
                            <CrewEditTrigger
                                crew={cr}
                                ariaLabel={t('row_edit_aria', { crew: cr.name })}
                                className="border-base-300 hover:bg-base-200/40 group flex flex-col justify-center border-r p-4 text-left transition"
                            >
                                <div className="text-sm font-semibold leading-tight">{cr.name}</div>
                                <div className="text-base-content/60 mt-1 text-[11px]">
                                    {cr.foremanName ?? t('no_foreman')} · {cr.memberCount} {t('crew_size_short')}
                                </div>
                                {cr.jobTitle && (
                                    <div className="text-base-content/50 mt-0.5 text-[11px]">{cr.jobTitle}</div>
                                )}
                            </CrewEditTrigger>
                            {days.map((d, di) => {
                                const dateStr = d.toISOString().slice(0, 10);
                                const slot = shiftsByCrewByDate.get(cr.id)?.get(dateStr) ?? null;
                                return (
                                    <div
                                        key={di}
                                        className={[
                                            'border-base-300 border-r p-2.5 last:border-r-0',
                                            di === 0 && isCurrentWeek ? 'bg-primary/5' : '',
                                        ].join(' ')}
                                    >
                                        {slot ? (
                                            <ShiftEditTrigger
                                                shift={slot}
                                                locale={locale}
                                                ariaLabel={t('cell_edit_aria', { date: dateStr })}
                                                className="text-left"
                                            >
                                                <ShiftCellContent shift={slot} t={t} />
                                            </ShiftEditTrigger>
                                        ) : (
                                            <Link
                                                href={
                                                    `/${locale}/employer/crews/new-shift?crewId=${cr.id}&date=${dateStr}` as Route
                                                }
                                                aria-label={t('cell_new_aria', { date: dateStr })}
                                                className="border-base-300 hover:border-base-content/40 hover:bg-base-200 text-base-content/40 hover:text-base-content/70 grid h-full min-h-[60px] place-items-center rounded-lg border border-dashed text-[11px] transition"
                                            >
                                                {t('cell_off')}
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
            </section>

            <h2 className="font-display mb-3 text-2xl font-light tracking-tight">{t('crew_leaders')}</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {crews.map((cr) => (
                    <article key={cr.id} className="bg-base-100 border-base-300 rounded-2xl border p-4">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-primary text-primary-content grid h-9 w-9 place-items-center rounded-full font-mono text-xs font-bold">
                                {(cr.foremanName ?? '—').split(' ').map((p) => p[0]).slice(0, 2).join('') || '—'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold">{cr.foremanName ?? t('hiring_foreman')}</div>
                                <div className="text-base-content/60 text-[11px]">
                                    {cr.name.split('·')[0]?.trim() ?? cr.name}
                                </div>
                            </div>
                        </div>
                        <div className="border-base-300 mt-3 grid grid-cols-2 gap-2 border-t border-dashed pt-3 text-[11px]">
                            <div>
                                <div className="text-base-content/60">{t('size')}</div>
                                <div className="font-mono text-sm font-bold">{cr.memberCount}</div>
                            </div>
                            <div>
                                <div className="text-base-content/60">{t('rating')}</div>
                                <div className="text-base-content/40 font-mono text-sm font-bold">—</div>
                            </div>
                        </div>
                        <div className="mt-3 flex flex-col gap-1.5">
                            <CrewEditTrigger
                                crew={cr}
                                ariaLabel={t('row_edit_aria', { crew: cr.name })}
                                className="border-base-300 hover:bg-base-200 inline-flex w-full items-center justify-center rounded-full border bg-transparent px-3 py-2 text-xs font-semibold"
                            >
                                {t('edit_crew_button')}
                            </CrewEditTrigger>
                            {cr.foremanUserId ? (
                                <Link
                                    href={`/${locale}/employer/messages?worker=${cr.foremanUserId}`}
                                    className="bg-base-content text-base-100 hover:bg-base-content/90 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold"
                                >
                                    <FontAwesomeIcon icon={faComments} className="h-3 w-3 shrink-0" />
                                    <span className="truncate">
                                        {t('message_foreman', { firstName: cr.foremanName?.split(' ')[0] ?? '' })}
                                    </span>
                                </Link>
                            ) : (
                                <span className="bg-base-200 border-base-300 text-base-content/40 inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold">
                                    <FontAwesomeIcon icon={faComments} className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{t('hiring_foreman')}</span>
                                </span>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}

function ShiftCellContent({
    shift,
    t,
}: {
    shift: ShiftView;
    t: Awaited<ReturnType<typeof getTranslations>>;
}) {
    const isCancelled = shift.status === 'cancelled';
    const isPending = !isCancelled && shift.confirmedCount < shift.assignedCount;
    const tone = isCancelled
        ? {
            bg: 'bg-base-200/60',
            body: 'text-base-content/55',
            time: 'text-base-content/70',
            bar: 'border-l-base-content/30',
        }
        : isPending
            ? {
                bg: 'bg-warning/10',
                body: 'text-base-content/80',
                time: 'text-warning',
                bar: 'border-l-warning',
            }
            : {
                bg: 'bg-primary/10',
                body: 'text-base-content/80',
                time: 'text-primary',
                bar: 'border-l-primary',
            };

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
                <div className={`text-[11px] font-bold tabular-nums ${tone.time}`}>
                    {shift.startTime}
                    {shift.endTime ? `–${shift.endTime}` : ''}
                </div>
                {isCancelled && (
                    <span className="text-[9px] font-mono uppercase tracking-wider opacity-70">
                        {t('cell_cancelled_pill')}
                    </span>
                )}
            </div>
            <div className="mt-0.5 truncate text-[11px]">{shift.locationLabel}</div>
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

function computeTotals(shifts: ShiftView[]) {
    let confirmed = 0;
    let assigned = 0;
    for (const s of shifts) {
        if (s.status === 'cancelled') continue;
        confirmed += s.confirmedCount;
        assigned += s.assignedCount;
    }
    const filling = Math.max(0, assigned - confirmed);
    const hours = shifts
        .filter((s) => s.status !== 'cancelled')
        .reduce((sum, s) => sum + estimateHours(s.startTime, s.endTime) * s.assignedCount, 0);
    return { confirmed, filling, hours: Math.round(hours) };
}

function estimateHours(start: string, end: string | null): number {
    if (!end) return 8;
    const [sh = 0, sm = 0] = start.split(':').map((x) => Number(x));
    const [eh = 0, em = 0] = end.split(':').map((x) => Number(x));
    return Math.max(0, eh + em / 60 - (sh + sm / 60));
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

function formatWeekRange(start: Date, locale: string): string {
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    const fmt = new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
    });
    return `${fmt.format(start)} – ${fmt.format(end)}`;
}

function addDaysIso(d: Date, days: number): string {
    const out = new Date(d);
    out.setUTCDate(d.getUTCDate() + days);
    return out.toISOString().slice(0, 10);
}
