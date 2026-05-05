import type { ReactNode } from 'react';

type DarkHeroCardProps = {
    children: ReactNode;
    glow?: 'gold' | 'olive' | 'none';
    className?: string;
};

export function DarkHeroCard({ children, glow = 'gold', className }: DarkHeroCardProps) {
    const glowClass =
        glow === 'gold'
            ? 'bg-[radial-gradient(circle_at_top_right,#D9B441_0%,transparent_60%)] opacity-25'
            : glow === 'olive'
                ? 'bg-[radial-gradient(circle_at_top_right,#5B6E2E_0%,transparent_60%)] opacity-25'
                : null;

    return (
        <div
            className={[
                'relative overflow-hidden rounded-2xl bg-neutral text-neutral-content shadow-[var(--shadow-card)]',
                className ?? '',
            ].join(' ')}
        >
            {glowClass && <div aria-hidden="true" className={['pointer-events-none absolute inset-0', glowClass].join(' ')} />}
            <div className="relative z-10 p-6 md:p-8">{children}</div>
        </div>
    );
}
