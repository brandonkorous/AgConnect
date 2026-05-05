import type { ReactNode } from 'react';

type Props = {
    heading: string;
    subtitle?: string;
    tone?: 'default' | 'danger';
    children: ReactNode;
};

export function SectionCard({ heading, subtitle, tone = 'default', children }: Props) {
    const borderClass = tone === 'danger' ? 'border-error/40' : 'border-base-300';
    return (
        <section className={['bg-base-100 rounded-2xl border p-6', borderClass].join(' ')}>
            <header className="mb-4">
                <h2 className="font-display text-xl font-normal leading-tight">{heading}</h2>
                {subtitle && (
                    <p className="text-base-content/70 mt-1 text-sm">{subtitle}</p>
                )}
            </header>
            {children}
        </section>
    );
}

type StatusBadgeProps = {
    tone: 'verified' | 'unverified' | 'primary';
    label: string;
};

export function StatusBadge({ tone, label }: StatusBadgeProps) {
    const cls =
        tone === 'verified'
            ? 'bg-success/15 text-success'
            : tone === 'primary'
                ? 'bg-primary/15 text-primary'
                : 'bg-warning/15 text-warning';
    return (
        <span
            className={[
                'inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider',
                cls,
            ].join(' ')}
        >
            {label}
        </span>
    );
}
