'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

type CheckboxCardProps = {
    name?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    title: string;
    description?: string;
    icon?: IconDefinition;
    disabled?: boolean;
    variant?: 'check' | 'toggle';
    className?: string;
};

export function CheckboxCard({
    name,
    checked,
    onChange,
    title,
    description,
    icon,
    disabled,
    variant = 'check',
    className,
}: CheckboxCardProps) {
    const stateClasses = checked
        ? 'border-primary bg-primary/5'
        : 'border-base-300 bg-base-100 hover:border-base-content/30';
    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

    return (
        <label
            className={[
                'relative flex items-start gap-3 rounded-2xl border p-4 transition-colors',
                'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
                stateClasses,
                disabledClasses,
                className ?? '',
            ].join(' ')}
        >
            {variant === 'check' ? (
                <input
                    type="checkbox"
                    name={name}
                    checked={checked}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.checked)}
                    className="sr-only"
                />
            ) : null}

            {icon && (
                <span
                    className={[
                        'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full',
                        checked ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content/60',
                    ].join(' ')}
                >
                    <FontAwesomeIcon icon={icon} className="h-4 w-4" />
                </span>
            )}

            <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-base-content">{title}</span>
                {description && (
                    <span className="mt-0.5 block text-sm text-base-content/70">{description}</span>
                )}
            </span>

            {variant === 'check' && checked && (
                <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-primary p-1 text-primary-content">
                    <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                </span>
            )}

            {variant === 'toggle' && (
                <input
                    type="checkbox"
                    name={name}
                    checked={checked}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.checked)}
                    className="toggle toggle-primary mt-1"
                />
            )}
        </label>
    );
}
