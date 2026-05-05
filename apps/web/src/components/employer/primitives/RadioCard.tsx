'use client';

import type { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

type RadioCardProps<T extends string> = {
    name: string;
    value: T;
    checked: boolean;
    onChange: (v: T) => void;
    title: string;
    description?: string;
    icon?: IconDefinition;
    chip?: ReactNode;
    disabled?: boolean;
    className?: string;
};

export function RadioCard<T extends string>({
    name,
    value,
    checked,
    onChange,
    title,
    description,
    icon,
    chip,
    disabled,
    className,
}: RadioCardProps<T>) {
    const stateClasses = checked
        ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
        : 'border-base-300 bg-base-100 hover:border-base-content/30';
    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

    return (
        <label
            className={[
                'flex items-start gap-3 rounded-2xl border p-4 transition-colors',
                'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
                stateClasses,
                disabledClasses,
                className ?? '',
            ].join(' ')}
        >
            <input
                type="radio"
                name={name}
                value={value}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(value)}
                className="sr-only"
            />
            {chip ? (
                <span className="shrink-0">{chip}</span>
            ) : icon ? (
                <span
                    className={[
                        'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full',
                        checked ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content/60',
                    ].join(' ')}
                >
                    <FontAwesomeIcon icon={icon} className="h-4 w-4" />
                </span>
            ) : null}
            <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-base-content">{title}</span>
                {description && (
                    <span className="mt-0.5 block text-sm text-base-content/70">{description}</span>
                )}
            </span>
            {chip && checked && (
                <span className="bg-primary text-primary-content grid h-5 w-5 place-items-center rounded-full">
                    <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" />
                </span>
            )}
        </label>
    );
}
