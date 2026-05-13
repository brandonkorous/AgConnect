type Size = 'sm' | 'md' | 'lg';

type Props = {
    percent: number;
    size?: Size;
    label?: string;
    className?: string;
};

const SIZE: Record<Size, { outer: number; inner: number; text: string; sub: string }> = {
    sm: { outer: 80, inner: 64, text: 'text-2xl', sub: 'text-[9px]' },
    md: { outer: 120, inner: 100, text: 'text-4xl', sub: 'text-[10px]' },
    lg: { outer: 150, inner: 124, text: 'text-5xl', sub: 'text-xs' },
};

export function ScoreDonut({ percent, size = 'md', label, className }: Props) {
    const pct = Math.max(0, Math.min(100, Math.round(percent)));
    const { outer, inner, text, sub } = SIZE[size];

    return (
        <div
            className={['grid place-items-center rounded-full', className ?? ''].join(' ')}
            style={{
                width: outer,
                height: outer,
                background: `conic-gradient(var(--color-primary) ${pct * 3.6}deg, var(--color-base-200) 0)`,
            }}
            role="img"
            aria-label={label ? `${label}: ${pct}%` : `${pct}%`}
        >
            <div
                className="bg-base-100 grid place-items-center rounded-full"
                style={{ width: inner, height: inner }}
            >
                <div className="text-center">
                    <div
                        className={[
                            'text-primary font-display font-semibold leading-none tracking-tight tabular-nums slashed-zero',
                            text,
                        ].join(' ')}
                    >
                        {pct}
                        <span className="text-base-content/40 text-lg">%</span>
                    </div>
                    {label && (
                        <div
                            className={[
                                'text-base-content/60 mt-1 font-semibold uppercase tracking-[0.18em]',
                                sub,
                            ].join(' ')}
                        >
                            {label}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
