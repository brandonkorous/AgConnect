'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { StatusBadge } from './StatusBadge';

type PlanCardProps = {
    tierKey: 'free' | 'pro' | 'enterprise';
    name: string;
    priceMonthly: string;
    priceYearly?: string;
    currentInterval?: 'monthly' | 'yearly';
    features: string[];
    cta: { label: string; onClick?: () => void; disabled?: boolean; tooltip?: string };
    isCurrent?: boolean;
    className?: string;
};

export function PlanCard({
    tierKey,
    name,
    priceMonthly,
    priceYearly,
    currentInterval = 'monthly',
    features,
    cta,
    isCurrent,
    className,
}: PlanCardProps) {
    const price = currentInterval === 'yearly' && priceYearly ? priceYearly : priceMonthly;
    const intervalSuffix = currentInterval === 'yearly' ? '/yr' : '/mo';

    const ctaButton = (
        <button
            type="button"
            onClick={cta.onClick}
            disabled={cta.disabled}
            className={['btn btn-primary w-full', cta.disabled ? 'btn-disabled' : ''].join(' ')}
        >
            {cta.label}
        </button>
    );

    return (
        <div
            data-tier={tierKey}
            className={[
                'card card-bordered card-compact bg-base-100 relative',
                isCurrent ? 'border-primary ring-2 ring-primary' : '',
                className ?? '',
            ].join(' ')}
        >
            <div className="card-body">
                {isCurrent && (
                    <div className="absolute right-4 top-4">
                        <StatusBadge status="active" label="CURRENT" />
                    </div>
                )}
                <h3 className="font-display text-xl text-base-content">{name}</h3>
                <p className="mt-1 text-3xl font-semibold tabular-nums slashed-zero text-base-content">
                    {price}
                    <span className="ml-1 text-sm font-normal text-base-content/60">
                        {intervalSuffix}
                    </span>
                </p>
                <ul className="menu menu-sm mt-4 px-0">
                    {features.map((f) => (
                        <li key={f} className="pointer-events-none">
                            <span className="flex items-start gap-2">
                                <FontAwesomeIcon
                                    icon={faCheck}
                                    className="mt-1 h-3 w-3 shrink-0 text-primary"
                                />
                                <span className="text-sm text-base-content/80">{f}</span>
                            </span>
                        </li>
                    ))}
                </ul>
                <div className="card-actions mt-6">
                    {cta.tooltip ? (
                        <div className="tooltip tooltip-bottom w-full" data-tip={cta.tooltip}>
                            {ctaButton}
                        </div>
                    ) : (
                        ctaButton
                    )}
                </div>
            </div>
        </div>
    );
}
