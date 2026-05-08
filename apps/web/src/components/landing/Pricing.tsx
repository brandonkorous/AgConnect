import { getTranslations } from 'next-intl/server';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { getFounderSlots } from '@/lib/api/landing';
import { PricingClient } from './PricingClient';

export async function Pricing() {
    const t = await getTranslations('landing.pricing');
    const founderSlots = await getFounderSlots();

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
                        <p className="text-base-content mt-2 font-sans text-lg leading-relaxed">
                            {t('body')}
                        </p>
                    </div>
                </div>

                <PricingClient
                    founderSlots={founderSlots}
                    labels={{
                        toggleMonthly: t('toggle.monthly'),
                        toggleYearly: t('toggle.yearly'),
                        founderBadgeActive: t('founder.badge_active', { remaining: founderSlots.remaining }),
                        founderBadgeEnded: t('founder.badge_ended'),
                        footnote: t('footnote'),
                        compareLink: t('compare_link'),
                    }}
                />
            </div>
        </section>
    );
}
