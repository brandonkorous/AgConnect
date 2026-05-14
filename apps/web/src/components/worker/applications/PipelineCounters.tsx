import { useTranslations } from 'next-intl';

export type PipelineCounts = {
    applied: number;
    reviewed: number;
    hired: number;
    withdrawn: number;
};

const TOPS: Record<keyof PipelineCounts, string> = {
    applied: 'oklch(95% 0.01 70)',
    reviewed: 'oklch(50% 0.09 120 / 0.18)',
    hired: 'oklch(75% 0.18 145 / 0.3)',
    withdrawn: 'oklch(75% 0.05 70 / 0.4)',
};

const ORDER: (keyof PipelineCounts)[] = ['applied', 'reviewed', 'hired', 'withdrawn'];

type Props = { counts: PipelineCounts };

export function PipelineCounters({ counts }: Props) {
    const t = useTranslations('worker.applications_dense.pipeline');
    return (
        <div className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {ORDER.map((k) => (
                <div
                    key={k}
                    className="border-base-300 bg-base-100 relative overflow-hidden rounded-2xl border p-[18px]"
                >
                    <div
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-[3px]"
                        style={{ background: TOPS[k] }}
                    />
                    <div className="text-base-content/60 font-mono text-xs font-semibold uppercase tracking-[0.18em]">
                        {t(`label.${k}`)}
                    </div>
                    <div className="font-serif mt-2 text-[40px] leading-none tracking-[-0.025em]">
                        {counts[k]}
                    </div>
                    <div className="text-base-content/60 mt-1.5 text-[11.5px]">
                        {t(`hint.${k}`)}
                    </div>
                </div>
            ))}
        </div>
    );
}
