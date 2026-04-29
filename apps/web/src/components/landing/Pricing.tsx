'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from '@/components/primitives/ArrowRight';
import { PlanCard } from './PlanCard';

type Cycle = 'monthly' | 'yearly';

export function Pricing() {
  const t = useTranslations('landing.pricing');
  const [cycle, setCycle] = useState<Cycle>('monthly');

  return (
    <section id="pricing" className="bg-moss text-bone w-full">
      <div className="mx-auto max-w-[1280px] px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
        <div className="flex flex-col items-start gap-6 pb-14 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3.5">
              <span className="bg-honey h-px w-8 shrink-0" aria-hidden />
              <span className="text-honey label">{t('eyebrow')}</span>
            </div>
            <h2 className="font-serif text-[40px] font-medium leading-[1.05] tracking-tight md:text-[56px]">
              {t('headline')}
            </h2>
          </div>
          <div className="border-bone/20 inline-flex border" role="tablist" aria-label="Billing cycle">
            <button
              type="button"
              role="tab"
              aria-selected={cycle === 'monthly'}
              onClick={() => setCycle('monthly')}
              className={`px-5 py-2.5 font-sans text-sm font-medium transition-colors ${
                cycle === 'monthly' ? 'bg-bone text-moss' : 'text-bone/80 hover:text-bone'
              }`}
            >
              {t('toggle.monthly')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={cycle === 'yearly'}
              onClick={() => setCycle('yearly')}
              className={`px-5 py-2.5 font-sans text-sm font-medium transition-colors ${
                cycle === 'yearly' ? 'bg-bone text-moss' : 'text-bone/80 hover:text-bone'
              }`}
            >
              {t('toggle.yearly')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <PlanCard
            variant="free"
            name={t('plan.free.name')}
            price={t(`plan.free.price.${cycle}`)}
            features={[
              t('plan.free.feature1'),
              t('plan.free.feature2'),
              t('plan.free.feature3'),
              t('plan.free.feature4'),
            ]}
            cta={t('plan.free.cta')}
            ctaHref="#final-cta"
          />
          <PlanCard
            variant="pro"
            name={t('plan.pro.name')}
            price={t(`plan.pro.price.${cycle}`)}
            ribbon={t('plan.pro.ribbon')}
            features={[
              t('plan.pro.feature1'),
              t('plan.pro.feature2'),
              t('plan.pro.feature3'),
              t('plan.pro.feature4'),
            ]}
            cta={t('plan.pro.cta')}
            ctaHref="#final-cta"
          />
          <PlanCard
            variant="enterprise"
            name={t('plan.enterprise.name')}
            price={t(`plan.enterprise.price.${cycle}`)}
            features={[
              t('plan.enterprise.feature1'),
              t('plan.enterprise.feature2'),
              t('plan.enterprise.feature3'),
              t('plan.enterprise.feature4'),
            ]}
            cta={t('plan.enterprise.cta')}
            ctaHref="mailto:sales@agconn.com"
          />
        </div>

        <div className="border-bone/15 mt-12 flex flex-col items-start gap-3 border-t pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-bone/70 font-sans text-sm">{t('footnote')}</p>
          <a
            href="/pricing"
            className="text-honey hover:text-bone inline-flex items-center gap-1.5 font-sans text-sm font-semibold"
          >
            <span>{t('compare_link')}</span>
            <ArrowRight size={12} stroke="#C8A24A" />
          </a>
        </div>
      </div>
    </section>
  );
}
