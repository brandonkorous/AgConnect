import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';

export type Plan = 'free' | 'pro' | 'enterprise';
export type Cycle = 'monthly' | 'yearly';

type Props = {
    plan: Plan;
    cycle: Cycle;
};

const features = ['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6'] as const;

export function PlanCard({ plan, cycle }: Props) {
    const t = useTranslations(`landing.pricing.plan.${plan}`);
    const isPro = plan === 'pro';
    const isEnterprise = plan === 'enterprise';

    const containerClass = isPro
        ? 'bg-primary text-primary-content relative shadow-2xl'
        : isEnterprise
            ? 'bg-neutral text-neutral-content'
            : 'card-bordered border-base-300 bg-base-100';

    const eyebrowTone = isPro || isEnterprise ? 'text-accent' : 'text-secondary';
    const nameTone = isPro ? 'text-primary-content' : isEnterprise ? 'text-neutral-content' : 'text-base-content';
    const priceTone = isPro ? 'text-primary-content' : isEnterprise ? 'text-neutral-content' : 'text-base-content';
    const subPriceTone = isPro ? 'text-primary-content/70' : isEnterprise ? 'text-neutral-content/70' : 'text-secondary';
    const dividerTone = isPro || isEnterprise ? 'border-secondary' : 'border-base-300';
    const featureTextTone = isPro ? 'text-primary-content' : isEnterprise ? 'text-neutral-content' : 'text-base-content';
    const iconTone = isPro || isEnterprise ? 'text-accent' : 'text-primary';
    const ctaBtnClass = isPro
        ? 'btn-accent'
        : isEnterprise
            ? 'btn-outline btn-accent'
            : 'btn-outline btn-primary';

    return (
        <article className={`card h-full ${containerClass}`}>
            {isPro && (
                <span className="badge badge-accent absolute -top-3 left-10 font-bold tracking-widest uppercase">
                    {t('ribbon')}
                </span>
            )}
            <div className="card-body p-10 gap-6">
                <div className="flex flex-col gap-2">
                    <p className={`label ${eyebrowTone}`}>{t('badge')}</p>
                    <p className={`font-serif text-3xl font-medium ${nameTone}`}>{t('name')}</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className={`font-serif text-6xl font-semibold leading-none tabular-nums tracking-tight ${priceTone}`}>
                            {t(`price.${cycle}.amount`)}
                        </span>
                        <span className={`font-sans text-sm ${subPriceTone}`}>{t(`price.${cycle}.unit`)}</span>
                    </div>
                    {plan !== 'free' && (
                        <p className="text-accent mt-0.5 font-sans text-sm">{t(`price.${cycle}.note`)}</p>
                    )}
                    <p className={`mt-2 font-sans text-sm leading-relaxed ${isPro ? 'text-primary-content/70' : isEnterprise ? 'text-neutral-content/70' : 'text-base-content'}`}>
                        {t('intro')}
                    </p>
                </div>

                <ul className={`flex flex-col gap-3.5 border-t pt-4 ${dividerTone}`}>
                    {features.map((f) => {
                        const text = t.raw(f);
                        if (!text) return null;
                        const included = !String(text).startsWith('-');
                        const cleanText = included ? String(text) : String(text).slice(1);
                        return (
                            <li key={f} className={`flex items-start gap-2.5 ${included ? '' : 'opacity-50'}`}>
                                <FontAwesomeIcon
                                    icon={included ? faCheck : faXmark}
                                    className={`mt-1 text-lg shrink-0 ${iconTone}`}
                                />
                                <span className={`font-sans text-sm leading-relaxed ${featureTextTone}`}>
                                    {cleanText}
                                </span>
                            </li>
                        );
                    })}
                </ul>

                <div className="card-actions mt-auto">
                    <a href={t('cta.href')} className={`btn btn-block ${ctaBtnClass}`}>
                        {t('cta.label')}
                    </a>
                </div>
            </div>
        </article>
    );
}

