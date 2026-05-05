import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faDownload,
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
import { EmptyStateCard } from '@/components/employer/primitives';
import { WeekJumper } from '@/components/employer/crews/WeekJumper';
import { WeekScheduleTable } from '@/components/employer/crews/WeekScheduleTable';
import { CrewLeaderCard } from '@/components/employer/crews/CrewLeaderCard';

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
        <div className=" px-5 pb-16 pt-8">
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

            {crews.length === 0 ? (
                <div className="mb-7">
                    <EmptyStateCard
                        icon={faUsers}
                        title={t('empty_no_crews_title')}
                        description={t('empty_no_crews')}
                        cta={{ label: t('new_crew_label'), href: `${basePath}/new` }}
                    />
                </div>
            ) : (
                <WeekScheduleTable
                    crews={crews}
                    days={days}
                    shiftsByCrewByDate={shiftsByCrewByDate}
                    locale={locale}
                    isCurrentWeek={isCurrentWeek}
                    t={t}
                />
            )}

            {crews.length > 0 && (
                <>
                    <h2 className="font-display mb-3 text-2xl font-light tracking-tight">{t('crew_leaders')}</h2>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                        {crews.map((cr) => (
                            <CrewLeaderCard key={cr.id} cr={cr} locale={locale} t={t} />
                        ))}
                    </div>
                </>
            )}
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
