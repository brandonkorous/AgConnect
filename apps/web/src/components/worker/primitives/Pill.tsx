type Tone = 'ghost' | 'primary' | 'success' | 'warning' | 'accent' | 'danger';

const TONE: Record<Tone, string> = {
  ghost: 'bg-base-200 text-base-content/70',
  primary: 'bg-primary/12 text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/20 text-warning-content',
  accent: 'bg-accent/20 text-accent-content',
  danger: 'bg-error/15 text-error',
};

type Props = {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
};

export function Pill({ tone = 'ghost', children, className = '' }: Props) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] font-mono text-[10px] font-bold uppercase tracking-[0.08em]',
        TONE[tone],
        className,
      ].join(' ')}
    >
      <span className="inline-block h-[5px] w-[5px] rounded-full bg-current" />
      {children}
    </span>
  );
}
