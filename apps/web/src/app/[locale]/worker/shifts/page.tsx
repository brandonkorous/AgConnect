import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faPlus } from '@fortawesome/free-solid-svg-icons';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';
import { ShiftsCalendar } from '@/components/worker/shifts/ShiftsCalendar';
import { UpNextList } from '@/components/worker/shifts/UpNextList';
import { fetchMyShifts } from '@/lib/api/me';
import { fetchProfile } from '@/lib/api/profile';

function fmtMoney(cents: number, locale: string): string {
    return new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(cents / 100);
}

type Props = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ month?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'worker.shifts' });
    return { title: t('meta.title') };
}

function parseMonth(raw: string | undefined): { year: number; month: number } {
    const now = new Date();
    if (raw && /^\d{4}-\d{2}$/.test(raw)) {
        const [y, m] = raw.split('-').map(Number);
        return { year: y ?? now.getUTCFullYear(), month: (m ?? 1) - 1 };
    }
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
}

export default async function ShiftsPage({ params, searchParams }: Props) {
    const { locale } = await params;
    const sp = await searchParams;
    const t = await getTranslations({ locale, namespace: 'worker.shifts' });

    const { year, month } = parseMonth(sp.month);
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 1));
    const [rows, profile] = await Promise.all([
        fetchMyShifts({
            from: start.toISOString().slice(0, 10),
            to: end.toISOString().slice(0, 10),
        }),
        fetchProfile(),
    ]);

    const totalHours = rows.reduce((acc, r) => acc + (r.hoursWorked ?? 0), 0);
    const employerCount = new Set(rows.map((r) => r.shift.employer)).size;
    // Projected pay = hours × wage band midpoint when wage is available; else 0.
    const projectedPayCents = 0;

    const monthLabel = new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(start);
    const county = profile.county ?? '_none';

    return (
        <div className=" px-5 pb-16 pt-8">
            <WorkerPageHeader
                eyebrow={t('eyebrow', { month: monthLabel, county })}
                title={
                    <>
                        {t('title.lead')}{' '}
                        <em className="text-primary font-light italic">{t('title.em')}</em>
                        .
                    </>
                }
                sub={t('sub')}
                right={
                    <>
                        <a
                            href="/api/me/shifts/ics"
                            download="agconn-shifts.ics"
                            className="border-base-300 inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-2 text-[13px] font-semibold no-underline"
                        >
                            <FontAwesomeIcon icon={faDownload} className="h-3 w-3" />
                            {t('cta_sync')}
                        </a>
                        <Link
                            href={`/${locale}/worker/profile#availability`}
                            className="btn btn-primary btn-sm rounded-full"
                        >
                            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                            {t('cta_availability')}
                        </Link>
                    </>
                }
            />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.7fr_1fr]">
                <ShiftsCalendar shifts={rows} locale={locale} year={year} month={month} />
                <div className="grid gap-3.5">
                    <MonthSummary
                        locale={locale}
                        counts={{
                            shifts: rows.length,
                            hours: totalHours,
                            payCents: projectedPayCents,
                            employers: employerCount,
                        }}
                    />
                    <UpNextList shifts={rows.slice(0, 4)} locale={locale} />
                </div>
            </div>
        </div>
    );
}

async function MonthSummary({
    locale,
    counts,
}: {
    locale: string;
    counts: { shifts: number; hours: number; payCents: number; employers: number };
}) {
    const t = await getTranslations({ locale, namespace: 'worker.shifts.summary' });
    const items: { value: string; sub: string; accent?: 'primary' | 'ink' }[] = [
        { value: String(counts.shifts), sub: t('shifts'), accent: 'ink' },
        { value: `${counts.hours.toFixed(0)}h`, sub: t('hours'), accent: 'ink' },
        {
            value: counts.payCents > 0 ? fmtMoney(counts.payCents, locale) : '—',
            sub: t('pay'),
            accent: 'primary',
        },
        { value: String(counts.employers), sub: t('employers'), accent: 'ink' },
    ];
    return (
        <div className="border-base-300 bg-base-100 rounded-2xl border p-[18px]">
            <div className="text-base-content/60 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em]">
                {t('eyebrow')}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
                {items.map((it) => (
                    <div key={it.sub}>
                        <div
                            className={[
                                'font-serif text-[28px] leading-none tracking-[-0.025em]',
                                it.accent === 'primary' ? 'text-primary' : 'text-base-content',
                            ].join(' ')}
                        >
                            {it.value}
                        </div>
                        <div className="text-base-content/60 mt-1 text-[11.5px]">{it.sub}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
