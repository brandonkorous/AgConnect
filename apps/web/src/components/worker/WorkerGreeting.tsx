import { useTranslations } from 'next-intl';

const SPARK_POINTS = [40, 52, 38, 70, 60, 88, 72, 95, 80, 110, 96, 124];

function Spark({ width = 240, height = 56 }: { width?: number; height?: number }) {
    const max = Math.max(...SPARK_POINTS);
    const lastIndex = SPARK_POINTS.length - 1;
    const lastValue = SPARK_POINTS[lastIndex] ?? 0;
    const xy = (p: number, i: number) => {
        const x = (i / lastIndex) * width;
        const y = height - (p / max) * height * 0.9 - 4;
        return { x, y };
    };
    const path = SPARK_POINTS.map((p, i) => {
        const { x, y } = xy(p, i);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
    const fill = `${path} L ${width} ${height} L 0 ${height} Z`;
    const lastPt = xy(lastValue, lastIndex);

    return (
        <svg width={width} height={height} role="img" aria-label="12-week earnings sparkline">
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

type GreetingProps = {
    name: string;
    upcomingShifts: number;
    newMatches: number;
};

export function WorkerGreeting({ name, upcomingShifts, newMatches }: GreetingProps) {
    const t = useTranslations('worker.dashboard.greeting');
    const isFresh = upcomingShifts === 0 && newMatches === 0;

    return (
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-base-content/60">
                    {t('context')}
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
            <div className="bg-base-100 border-base-300 rounded-2xl border p-3.5">
                <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-base-content/60">
                    {t('earnings_eyebrow')}
                </div>
                <div className="mt-1">
                    <Spark />
                </div>
            </div>
        </header>
    );
}
