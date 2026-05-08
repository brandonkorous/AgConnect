'use client';

import { useState } from 'react';
import { FounderBadge } from '@/components/marketing/FounderBadge';
import { PlanCard, type Cycle } from './PlanCard';
import type { FounderSlots } from '@/lib/api/landing';

type Props = {
    founderSlots: FounderSlots;
    labels: {
        toggleMonthly: string;
        toggleYearly: string;
        founderBadgeActive: string;
        founderBadgeEnded: string;
        footnote: string;
        compareLink: string;
    };
};

export function PricingClient({ founderSlots, labels }: Props) {
    const [cycle, setCycle] = useState<Cycle>('yearly');
    const cohort: 'founder' | 'standard' = founderSlots.active ? 'founder' : 'standard';

    return (
        <>
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                <FounderBadge
                    slots={founderSlots}
                    activeLabel={labels.founderBadgeActive}
                    endedLabel={labels.founderBadgeEnded}
                />
                <div role="tablist" aria-label="Billing cycle" className="tabs tabs-box bg-base-100">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={cycle === 'yearly'}
                        onClick={() => setCycle('yearly')}
                        className={`tab ${cycle === 'yearly' ? 'tab-active bg-primary text-primary-content' : 'text-secondary'}`}
                    >
                        {labels.toggleYearly}
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={cycle === 'monthly'}
                        onClick={() => setCycle('monthly')}
                        className={`tab ${cycle === 'monthly' ? 'tab-active bg-primary text-primary-content' : 'text-secondary'}`}
                    >
                        {labels.toggleMonthly}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <PlanCard plan="free" cycle={cycle} cohort={cohort} />
                <PlanCard plan="pro" cycle={cycle} cohort={cohort} />
                <PlanCard plan="enterprise" cycle={cycle} cohort={cohort} />
            </div>

            <div className="flex flex-col items-center justify-center gap-3 pt-4 md:flex-row md:gap-6">
                <p className="text-secondary font-sans text-sm">{labels.footnote}</p>
                <span className="bg-secondary/30 hidden h-4 w-px md:block" aria-hidden />
                <a
                    href="/pricing"
                    className="link link-hover text-primary hover:text-base-content text-sm font-semibold"
                >
                    {labels.compareLink} →
                </a>
            </div>
        </>
    );
}
