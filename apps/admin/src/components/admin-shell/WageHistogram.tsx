type Props = {
    distribution: { bucket: number; n: number }[];
    median: number | null;
    p10: number | null;
    p90: number | null;
};

// WIDTH_BUCKET(wage, 14, 30, 8) returns 1..8 for in-range, 0 below, 9 above.
const BUCKET_LABELS = [
    { id: 0, label: '<$14' },
    { id: 1, label: '$14–16' },
    { id: 2, label: '$16–18' },
    { id: 3, label: '$18–20' },
    { id: 4, label: '$20–22' },
    { id: 5, label: '$22–24' },
    { id: 6, label: '$24–26' },
    { id: 7, label: '$26–28' },
    { id: 8, label: '$28–30' },
    { id: 9, label: '$30+' },
];

export function WageHistogram({ distribution, median, p10, p90 }: Props) {
    const byBucket = new Map(distribution.map((d) => [d.bucket, d.n]));
    const counts = BUCKET_LABELS.map((b) => byBucket.get(b.id) ?? 0);
    const max = Math.max(1, ...counts);
    const total = counts.reduce((s, n) => s + n, 0);

    return (
        <div className="bg-base-100 border-base-300 rounded-box border p-5">
            <div className="flex items-baseline justify-between">
                <h3 className="font-serif text-sm font-medium">Wage distribution at hire</h3>
                <span className="text-base-content/60 font-mono text-xs tabular-nums">
                    {total} hires
                </span>
            </div>
            <div className="mt-4 flex h-32 items-end gap-1">
                {counts.map((n, i) => (
                    <div
                        key={BUCKET_LABELS[i]!.id}
                        className="bg-primary/15 hover:bg-primary/30 group relative flex-1 rounded-t transition-colors"
                        style={{ height: `${(n / max) * 100}%` }}
                        title={`${BUCKET_LABELS[i]!.label}: ${n}`}
                    >
                        <span className="text-base-content/80 absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[10px] tabular-nums opacity-0 group-hover:opacity-100">
                            {n || ''}
                        </span>
                    </div>
                ))}
            </div>
            <div className="text-base-content/50 mt-1 flex justify-between text-[10px] font-mono">
                {BUCKET_LABELS.map((b) => (
                    <span key={b.id} className="flex-1 text-center">
                        {b.label.replace('$', '')}
                    </span>
                ))}
            </div>
            <dl className="border-base-200 mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-center">
                <Stat label="p10" value={p10} />
                <Stat label="Median" value={median} />
                <Stat label="p90" value={p90} />
            </dl>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: number | null }) {
    return (
        <div>
            <dt className="text-base-content/60 text-[10px] uppercase tracking-wide">{label}</dt>
            <dd className="font-mono text-sm tabular-nums">
                {value == null ? '—' : `$${value.toFixed(2)}`}
            </dd>
        </div>
    );
}
