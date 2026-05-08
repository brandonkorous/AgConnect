'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCheck } from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { FounderBadge } from './FounderBadge';
import type { FounderSlots } from '@/lib/api/landing';

type Locale = 'en' | 'es';
type PlanId = 'seed' | 'field' | 'farm';
type Cycle = 'monthly' | 'yearly';

const PLANS: { id: PlanId; highlighted?: boolean; isPaid: boolean; href: string }[] = [
    { id: 'seed', isPaid: false, href: '/employer/sign-up' },
    { id: 'field', highlighted: true, isPaid: true, href: '/employer/sign-up?plan=field' },
    { id: 'farm', isPaid: true, href: 'mailto:sales@agconn.com?subject=Farm%20plan' },
];

const FEATURES = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'] as const;

type Props = { locale: Locale; founderSlots: FounderSlots };

export function PricingPlanGrid({ locale, founderSlots }: Props) {
    const t = useTranslations('marketing.pricing_page');
    const [cycle, setCycle] = useState<Cycle>('yearly');
    const cohort: 'founder' | 'standard' = founderSlots.active ? 'founder' : 'standard';

    return (
        <section className="bg-base-200 w-full border-secondary/15 border-t">
            <div className="container mx-auto flex flex-col gap-12 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('plans.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('plans.headline')}
                        </h2>
                    </div>
                    <div
                        role="tablist"
                        aria-label={t('toggle.monthly')}
                        className="tabs tabs-box bg-base-100 self-start md:self-auto"
                    >
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

                <FounderBadge
                    slots={founderSlots}
                    activeLabel={t('founder.badge_active', { remaining: founderSlots.remaining })}
                    endedLabel={t('founder.badge_ended')}
                />

                <div className="grid grid-cols-1 gap-px bg-secondary/15 md:grid-cols-3">
                    {PLANS.map((plan) => (
                        <PlanCardCell
                            key={plan.id}
                            plan={plan}
                            cycle={cycle}
                            cohort={cohort}
                            locale={locale}
                            t={t}
                        />
                    ))}
                </div>

                <p className="text-secondary font-sans text-sm text-center max-w-prose mx-auto">
                    {t('plans.footnote')}
                </p>
            </div>
        </section>
    );
}

type Translator = (key: string, values?: Record<string, string | number>) => string;

type CellProps = {
    plan: (typeof PLANS)[number];
    cycle: Cycle;
    cohort: 'founder' | 'standard';
    locale: Locale;
    t: Translator;
};

function PlanCardCell({ plan, cycle, cohort, locale, t }: CellProps) {
    const isHighlighted = plan.highlighted;
    const isMailto = plan.href.startsWith('mailto:');
    const cardClasses = isHighlighted
        ? 'bg-primary text-primary-content lg:-my-4 lg:py-12'
        : 'bg-base-100 text-base-content';
    const eyebrowClasses = isHighlighted ? 'text-accent' : 'text-secondary';
    const bodyTextClasses = isHighlighted ? 'text-primary-content/85' : 'text-secondary';
    const checkColor = isHighlighted ? 'text-accent' : 'text-primary';
    const featureTextClasses = isHighlighted ? 'text-primary-content/95' : 'text-base-content';
    const periodClasses = isHighlighted ? 'text-primary-content/70' : 'text-secondary';
    const strikethroughClasses = isHighlighted ? 'text-primary-content/55' : 'text-secondary/55';

    const showFounder = plan.isPaid && cohort === 'founder';
    const activeAmountKey = `plans.${plan.id}.price.${cycle}.${showFounder ? 'founder_amount' : 'standard_amount'}`;
    const strikeAmountKey = `plans.${plan.id}.price.${cycle}.standard_amount`;
    const unitKey = `plans.${plan.id}.price.${cycle}.unit`;
    const ctaKey = `plans.${plan.id}.${showFounder ? 'cta_founder' : 'cta_standard'}`;

    const ctaContent = (
        <>
            <span>{t(ctaKey)}</span>
            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
        </>
    );
    const ctaClass = `${isHighlighted ? 'btn btn-accent' : 'btn btn-outline btn-primary'} mt-auto self-stretch`;

    return (
        <article className={`${cardClasses} flex flex-col gap-6 p-8 lg:p-10 relative`}>
            {isHighlighted ? (
                <span className="bg-accent text-neutral absolute -top-3 left-8 font-mono text-xs font-bold uppercase tracking-[0.22em] px-3 py-1">
                    {t('plans.field.badge')}
                </span>
            ) : null}

            <div className="flex flex-col gap-2">
                <span className={`${eyebrowClasses} font-mono text-xs font-bold uppercase tracking-[0.22em]`}>
                    {t(`plans.${plan.id}.label`)}
                </span>
                <h3 className="font-serif text-2xl font-semibold leading-tight tracking-tight">
                    {t(`plans.${plan.id}.name`)}
                </h3>
            </div>

            <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-3">
                    <span className={`${isHighlighted ? 'text-accent' : 'text-base-content'} font-mono text-4xl font-bold leading-none tracking-tight tabular-nums`}>
                        {t(activeAmountKey)}
                    </span>
                    {showFounder ? (
                        <span className={`${strikethroughClasses} font-mono text-xl line-through tabular-nums`}>
                            {t(strikeAmountKey)}
                        </span>
                    ) : null}
                </div>
                <span className={`${periodClasses} font-mono text-xs uppercase tracking-[0.18em]`}>
                    {t(unitKey)}
                </span>
                {showFounder ? (
                    <span className={`${isHighlighted ? 'text-accent' : 'text-primary'} font-mono text-xs uppercase tracking-[0.18em] mt-1`}>
                        {t('founder.note')}
                    </span>
                ) : null}
            </div>

            <p className={`${bodyTextClasses} font-sans text-sm leading-relaxed`}>
                {t(`plans.${plan.id}.tagline`)}
            </p>

            <ul className={`${isHighlighted ? 'border-accent/30' : 'border-secondary/20'} flex flex-col gap-3 border-t pt-6`}>
                {FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                        <FontAwesomeIcon icon={faCheck} className={`${checkColor} mt-1 text-xs shrink-0`} />
                        <span className={`${featureTextClasses} font-sans text-sm leading-snug`}>
                            {t(`plans.${plan.id}.${f}`)}
                        </span>
                    </li>
                ))}
            </ul>

            {isMailto ? (
                <a href={plan.href} className={ctaClass}>
                    {ctaContent}
                </a>
            ) : (
                <Link href={`/${locale}${plan.href}`} className={ctaClass}>
                    {ctaContent}
                </Link>
            )}
        </article>
    );
}
