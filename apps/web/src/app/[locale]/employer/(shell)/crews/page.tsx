import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faDownload, faComments, faUsers } from '@fortawesome/free-solid-svg-icons';
import { listCrews, listShifts, startOfWorkWeek, type ShiftView } from '@/lib/api/employer-ops';
import { NewCrewButton } from '@/components/employer/crews/NewCrewButton';
import { DownloadButton } from '@/components/employer/primitives/DownloadButton';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.crews' });
  return { title: `AgConn — ${t('title')}` };
}

export default async function CrewsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.crews' });

  const [crews, shifts] = await Promise.all([listCrews(), listShifts()]);

  const weekStart = startOfWorkWeek(new Date());
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

  return (
    <div className="px-5 md:px-8 lg:px-20 pb-16 pt-8">
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
            path={`/v1/employer/shifts/schedule.csv?from=${weekStart.toISOString().slice(0, 10)}`}
            label={t('export')}
            icon={faDownload}
            filename={`agconn-schedule-${weekStart.toISOString().slice(0, 10)}.csv`}
            variant="pill"
          />
          <NewCrewButton />
          <Link
            href={`/${locale}/employer/crews/new-shift`}
            className="btn btn-sm btn-primary rounded-full"
          >
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
            {t('new_shift')}
          </Link>
        </div>
      </div>

      <section className="bg-base-100 border-base-300 mb-7 overflow-hidden rounded-2xl border">
        <div className="border-base-300 grid grid-cols-[180px_repeat(7,1fr)] border-b">
          <div className="bg-base-200 border-base-300 text-base-content/60 border-r px-5 py-4 font-mono text-[11px] font-bold uppercase tracking-wider">
            {t('header_label')}
          </div>
          {days.map((d, i) => (
            <div
              key={i}
              className={[
                'border-base-300 border-r px-4 py-3 last:border-r-0',
                i === 0 ? 'bg-primary/10' : 'bg-base-200',
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
                'grid min-h-[110px] grid-cols-[180px_repeat(7,1fr)]',
                ci < crews.length - 1 ? 'border-base-300 border-b' : '',
              ].join(' ')}
            >
              <div className="border-base-300 flex flex-col justify-center border-r p-4">
                <div className="text-sm font-semibold leading-tight">{cr.name}</div>
                <div className="text-base-content/60 mt-1 text-[11px]">
                  {cr.foremanName ?? t('no_foreman')} · {cr.memberCount} {t('crew_size_short')}
                </div>
                {cr.jobTitle && (
                  <div className="text-base-content/50 mt-0.5 text-[11px]">{cr.jobTitle}</div>
                )}
              </div>
              {days.map((d, di) => {
                const dateStr = d.toISOString().slice(0, 10);
                const slot = shiftsByCrewByDate.get(cr.id)?.get(dateStr) ?? null;
                return (
                  <div
                    key={di}
                    className={[
                      'border-base-300 border-r p-2.5 last:border-r-0',
                      di === 0 ? 'bg-primary/5' : '',
                    ].join(' ')}
                  >
                    {slot ? (
                      <ShiftCell shift={slot} t={t} />
                    ) : (
                      <div className="border-base-300 text-base-content/40 grid h-full min-h-[60px] place-items-center rounded-lg border border-dashed text-[11px]">
                        {t('cell_off')}
                      </div>
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
          <div key={cr.id} className="bg-base-100 border-base-300 rounded-2xl border p-4">
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
            {cr.foremanUserId ? (
              <Link
                href={`/${locale}/employer/messages?worker=${cr.foremanUserId}`}
                className="bg-base-200 hover:bg-base-300 border-base-300 mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold"
              >
                <FontAwesomeIcon icon={faComments} className="h-3 w-3" />
                {t('message_foreman', { firstName: cr.foremanName?.split(' ')[0] ?? '' })}
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="bg-base-200 border-base-300 text-base-content/40 mt-3 inline-flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold"
              >
                <FontAwesomeIcon icon={faComments} className="h-3 w-3" />
                {t('hiring_foreman')}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ShiftCell({
  shift,
  t,
}: {
  shift: ShiftView;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const isPending = shift.confirmedCount < shift.assignedCount;
  const tone = isPending
    ? { bg: 'bg-warning/15', fg: 'text-warning-content', bar: 'border-l-warning' }
    : { bg: 'bg-primary/15', fg: 'text-primary',          bar: 'border-l-primary' };

  return (
    <div
      className={[
        'rounded-lg border-l-4 p-2.5',
        tone.bg,
        tone.fg,
        tone.bar,
      ].join(' ')}
    >
      <div className="text-[11px] font-bold">
        {shift.startTime}{shift.endTime ? `–${shift.endTime}` : ''}
      </div>
      <div className="mt-0.5 text-[11px]">{shift.locationLabel}</div>
      <div className="mt-1.5 inline-flex items-center gap-1 font-mono text-[10px]">
        <FontAwesomeIcon icon={faUsers} className="h-2.5 w-2.5" />
        {shift.confirmedCount}/{shift.assignedCount}{' '}
        {isPending ? t('cell_pending_suffix') : t('cell_confirmed_suffix')}
      </div>
    </div>
  );
}

function computeTotals(shifts: ShiftView[]) {
  let confirmed = 0;
  let assigned = 0;
  for (const s of shifts) {
    confirmed += s.confirmedCount;
    assigned += s.assignedCount;
  }
  const filling = Math.max(0, assigned - confirmed);
  const hours = shifts.reduce((sum, s) => sum + estimateHours(s.startTime, s.endTime) * s.assignedCount, 0);
  return { confirmed, filling, hours: Math.round(hours) };
}

function estimateHours(start: string, end: string | null): number {
  if (!end) return 8;
  const [sh = 0, sm = 0] = start.split(':').map((x) => Number(x));
  const [eh = 0, em = 0] = end.split(':').map((x) => Number(x));
  return Math.max(0, eh + em / 60 - (sh + sm / 60));
}

function weekday(d: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', { weekday: 'short' }).format(d);
}

function monthDay(d: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(d);
}

function formatWeekRange(start: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(start);
}
