'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useUser } from '@clerk/nextjs';
import { useProfileSuspense } from '@/lib/api/hooks/profile';
import { useMyShiftsSuspense } from '@/lib/api/hooks/shifts';
import { useRecommendedJobsSuspense } from '@/lib/api/hooks/jobs';

function Spark({
    points,
    width = 240,
    height = 56,
    ariaLabel,
}: {
    points: number[];
    width?: number;
    height?: number;
    ariaLabel: string;
}) {
    const max = Math.max(...points);
    const lastIndex = points.length - 1;
    const lastValue = points[lastIndex] ?? 0;
    const xy = (p: number, i: number) => {
        const x = (i / lastIndex) * width;
        const y = height - (p / max) * height * 0.9 - 4;
        return { x, y };
    };
    const path = points.map((p, i) => {
        const { x, y } = xy(p, i);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
    const fill = `${path} L ${width} ${height} L 0 ${height} Z`;
    const lastPt = xy(lastValue, lastIndex);

    return (
        <svg width={width} height={height} role="img" aria-label={ariaLabel}>
            <path
                d={path}
                stroke="currentColor"
                className="text-primary"
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path d={fill} className="text-primary" fill="currentColor" opacity={0.1} />
            <circle
                cx={lastPt.x}
                cy={lastPt.y}
                r={3.5}
                fill="white"
                stroke="currentColor"
                className="text-primary"
                strokeWidth={2}
            />
        </svg>
    );
}

function formatContext(locale: string, county?: string | null): string {
    const fmtLocale = locale === 'es' ? 'es-MX' : 'en-US';
    const today = new Intl.DateTimeFormat(fmtLocale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    }).format(new Date());
    const where = county ? `${county}, CA` : '';
    return where ? `${today} · ${where}` : today;
}

export function WorkerGreeting() {
    const locale = useLocale();
    const t = useTranslations('worker.dashboard.greeting');
    const { user: clerkUser } = useUser();
    const { data: profile } = useProfileSuspense();
    const { data: shifts } = useMyShiftsSuspense();
    const { data: matched } = useRecommendedJobsSuspense();

    const name =
        profile.firstName ||
        clerkUser?.firstName ||
        (locale === 'es' ? 'Trabajador' : 'there');
    const county = profile.county ?? null;
    const now = Date.now();
    const upcomingShifts = shifts.filter(
        (s) => new Date(s.shift.startTime).getTime() >= now,
    ).length;
    const newMatches = matched.length;
    const isFresh = upcomingShifts === 0 && newMatches === 0;
    const earningsTrend: number[] | null = null;
    const showSpark = !!earningsTrend && (earningsTrend as number[]).some((v) => v > 0);

    return (
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-base-content/60">
                    {formatContext(locale, county)}
                </span>
                <h1 className="font-serif mt-2 text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
                    {t('salutation', { name })}
                </h1>
                <p className="text-base-content/70 mt-1.5 text-base">
                    {isFresh
                        ? t('summary_empty')
                        : t('summary', { shifts: upcomingShifts, matches: newMatches })}
                </p>
            </div>
            {showSpark && (
                <div className="bg-base-100 border-base-300 rounded-2xl border p-3.5">
                    <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-base-content/60">
                        {t('earnings_eyebrow')}
                    </div>
                    <div className="mt-1">
                        <Spark
                            points={earningsTrend!}
                            ariaLabel={t('earnings_eyebrow')}
                        />
                    </div>
                </div>
            )}
        </header>
    );
}
