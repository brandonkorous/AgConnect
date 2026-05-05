'use client';

import type { ReactNode } from 'react';

type FilterChipProps = {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
    count?: number;
    ariaLabel?: string;
};

export function FilterChip({ active, onClick, children, count, ariaLabel }: FilterChipProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            aria-label={ariaLabel}
            className={[
                'btn btn-sm rounded-full',
                active ? 'btn-primary' : 'btn-ghost',
            ].join(' ')}
        >
            <span>{children}</span>
            {count != null && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-base-200 px-1.5 font-mono text-[10px] text-base-content/70">
                    {count}
                </span>
            )}
        </button>
    );
}
