type Props = {
  label: string;
  value: string;
  sub?: string;
  accent?: 'primary' | 'accent' | 'ink';
};

const ACCENT_CLS: Record<NonNullable<Props['accent']>, string> = {
  primary: 'text-primary',
  accent: 'text-warning',
  ink: 'text-base-content',
};

export function StatTile({ label, value, sub, accent }: Props) {
  return (
    <div className="border-base-300 bg-base-100 rounded-2xl border p-[18px]">
      <div className="text-base-content/60 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em]">
        {label}
      </div>
      <div
        className={[
          'font-serif mt-2 text-[40px] font-normal leading-none tracking-[-0.025em]',
          accent ? ACCENT_CLS[accent] : 'text-base-content',
        ].join(' ')}
      >
        {value}
      </div>
      {sub && (
        <div className="text-base-content/60 mt-1.5 text-[11.5px]">{sub}</div>
      )}
    </div>
  );
}
