'use client';

import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

export type Plan = 'free' | 'pro' | 'enterprise';
export type Cycle = 'monthly' | 'yearly';
export type Cohort = 'founder' | 'standard';

type Props = {
    plan: Plan;
    cycle: Cycle;
    cohort: Cohort;
};

const features = ['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6'] as const;

export function PlanCard({ plan, cycle, cohort }: Props) {
    const t = useTranslations(`landing.pricing.plan.${plan}`);
    const tRoot = useTranslations('landing.pricing');
    const isPro = plan === 'pro';
    const isEnterprise = plan === 'enterprise';
    const isPaid = isPro || isEnterprise;
    const showFounder = isPaid && cohort === 'founder';

    const containerClass = isPro
        ? 'bg-primary text-primary-content relative shadow-2xl'
        : isEnterprise
            ? 'bg-neutral text-neutral-content'
            : 'card-bordered border-base-300 bg-base-100';

    const eyebrowTone = isPro || isEnterprise ? 'text-accent' : 'text-secondary';
    const nameTone = isPro ? 'text-primary-content' : isEnterprise ? 'text-neutral-content' : 'text-base-content';
    const priceTone = isPro ? 'text-primary-content' : isEnterprise ? 'text-neutral-content' : 'text-base-content';
    const subPriceTone = isPro ? 'text-primary-content/70' : isEnterprise ? 'text-neutral-content/70' : 'text-secondary';
    const strikeTone = isPro ? 'text-primary-content/55' : isEnterprise ? 'text-neutral-content/55' : 'text-secondary/55';
    const dividerTone = isPro || isEnterprise ? 'border-secondary' : 'border-base-300';
    const featureTextTone = isPro ? 'text-primary-content' : isEnterprise ? 'text-neutral-content' : 'text-base-content';
    const iconTone = isPro || isEnterprise ? 'text-accent' : 'text-primary';
    const noteTone = isPro || isEnterprise ? 'text-accent' : 'text-primary';
    const ctaBtnClass = isPro
        ? 'btn-accent'
        : isEnterprise
            ? 'btn-outline btn-accent'
            : 'btn-outline btn-primary';

    const activeAmount = t(`price.${cycle}.${showFounder ? 'founder_amount' : 'standard_amount'}`);
    const strikeAmount = t(`price.${cycle}.standard_amount`);
    const unit = t(`price.${cycle}.unit`);
    const ctaLabel = t(showFounder ? 'cta.label_founder' : 'cta.label_standard');

    return (
        <article className={`card h-full ${containerClass}`}>
            {isPro && (
                <span className="badge badge-accent absolute -top-3 left-10 font-bold tracking-widest uppercase">
                    {t('ribbon')}
                </span>
            )}
            <div className="card-body p-10 gap-6">
                <div className="flex flex-col gap-2">
                    <p className={`label ${eyebrowTone}`}>{t('eyebrow')}</p>
                    <p className={`font-serif text-3xl font-medium ${nameTone}`}>{t('name')}</p>
                    <div className="flex items-baseline gap-3">
                        <span className={`font-serif text-6xl font-semibold leading-none tabular-nums tracking-tight ${priceTone}`}>
                            {activeAmount}
                        </span>
                        <span className={`font-sans text-sm ${subPriceTone}`}>{unit}</span>
                        {showFounder && (
                            <span className={`font-serif text-2xl tabular-nums line-through ${strikeTone}`}>
                                {strikeAmount}
                            </span>
                        )}
                    </div>
                    {showFounder && (
                        <p className={`mt-0.5 font-sans text-sm ${noteTone}`}>{tRoot('founder.note')}</p>
                    )}
                    <p
                        className={`mt-2 font-sans text-sm leading-relaxed ${
                            isPro
                                ? 'text-primary-content/70'
                                : isEnterprise
                                    ? 'text-neutral-content/70'
                                    : 'text-base-content'
                        }`}
                    >
                        {t('tagline')}
                    </p>
                </div>

                <ul className={`flex flex-col gap-3.5 border-t pt-4 ${dividerTone}`}>
                    {features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                            <FontAwesomeIcon icon={faCheck} className={`mt-1 text-lg shrink-0 ${iconTone}`} />
                            <span className={`font-sans text-sm leading-relaxed ${featureTextTone}`}>
                                {t(f)}
                            </span>
                        </li>
                    ))}
                </ul>

                <div className="card-actions mt-auto">
                    <a href={t('cta.href')} className={`btn btn-block ${ctaBtnClass}`}>
                        {ctaLabel}
                    </a>
                </div>
            </div>
        </article>
    );
}
