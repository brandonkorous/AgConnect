'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { PlanCard, type Cycle } from './PlanCard';

export function Pricing() {
    const t = useTranslations('landing.pricing');
    const [cycle, setCycle] = useState<Cycle>('yearly');

    return (
        <section id="pricing" className="bg-base-200 w-full">
            <div className="container mx-auto flex flex-col gap-16 px-5 py-24 md:px-8 md:py-28 lg:px-20 lg:py-30">
                <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-end lg:gap-16">
                    <div className="flex flex-1 flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-4xl font-medium tracking-tight md:text-5xl lg:text-6xl">
                            {t('headline')}
                        </h2>
                        <p className="text-base-content  mt-2 font-sans text-lg leading-relaxed">
                            {t('body')}
                        </p>
                    </div>
                    <div role="tablist" aria-label="Billing cycle" className="tabs tabs-box bg-base-100">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={cycle === 'yearly'}
                            onClick={() => setCycle('yearly')}
                            className={`tab ${cycle === 'yearly' ? 'tab-active bg-primary text-primary-content' : 'text-secondary'}`}
                        >
                            {t('toggle.yearly')}
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={cycle === 'monthly'}
                            onClick={() => setCycle('monthly')}
                            className={`tab ${cycle === 'monthly' ? 'tab-active bg-primary text-primary-content' : 'text-secondary'}`}
                        >
                            {t('toggle.monthly')}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <PlanCard plan="free" cycle={cycle} />
                    <PlanCard plan="pro" cycle={cycle} />
                    <PlanCard plan="enterprise" cycle={cycle} />
                </div>

                <div className="flex flex-col items-center justify-center gap-3 pt-4 md:flex-row md:gap-6">
                    <p className="text-secondary font-sans text-sm">{t('footnote')}</p>
                    <span className="bg-secondary/30 hidden h-4 w-px md:block" aria-hidden />
                    <a href="/pricing" className="link link-hover text-primary hover:text-base-content text-sm font-semibold">
                        {t('compare_link')} →
                    </a>
                </div>
            </div>
        </section>
    );
}
