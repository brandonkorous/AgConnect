import type { ReactNode } from 'react';
import Link from 'next/link';
import type { Route } from 'next';

type CommonProps = {
    active: boolean;
    children: ReactNode;
    count?: number;
    ariaLabel?: string;
};

type ButtonVariantProps = CommonProps & {
    onClick: () => void;
    href?: never;
};

type LinkVariantProps = CommonProps & {
    href: string;
    onClick?: never;
};

type FilterChipProps = ButtonVariantProps | LinkVariantProps;

export function FilterChip(props: FilterChipProps) {
    const { active, children, count, ariaLabel } = props;
    const className = [
        'btn btn-sm rounded-full',
        active ? 'btn-primary' : 'btn-ghost',
    ].join(' ');

    const inner = (
        <>
            <span>{children}</span>
            {count != null && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-base-200 px-1.5 font-mono text-[10px] text-base-content/70">
                    {count}
                </span>
            )}
        </>
    );

    if ('href' in props && props.href != null) {
        return (
            <Link
                href={props.href as Route}
                aria-current={active ? 'page' : undefined}
                aria-label={ariaLabel}
                className={className}
            >
                {inner}
            </Link>
        );
    }

    return (
        <button
            type="button"
            onClick={props.onClick}
            aria-pressed={active}
            aria-label={ariaLabel}
            className={className}
        >
            {inner}
        </button>
    );
}
