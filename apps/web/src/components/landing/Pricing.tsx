'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { PlanCard, type Cycle } from './PlanCard';

export function Pricing() {
  const t = useTranslations('landing.pricing');
  const [cycle, setCycle] = useState<Cycle>('yearly');

  return (
    <section id="pricing" className="bg-bone-warm w-full">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-16 px-5 py-24 md:px-8 md:py-28 lg:px-20 lg:py-30">
        <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end lg:gap-16">
          <div className="flex max-w-[680px] flex-col gap-4">
            <EyebrowLabel tone="soil" withRule>
              {t('eyebrow')}
            </EyebrowLabel>
            <h2 className="text-ink font-serif text-[40px] font-medium leading-[1.05] tracking-[-0.03em] md:text-[52px] lg:text-[64px]">
              {t('headline.line1')}
              <br />
              {t('headline.line2')}
            </h2>
            <p className="text-text-deep mt-2 max-w-[580px] font-sans text-lg leading-relaxed">
              {t('body')}
            </p>
          </div>
          <div
            role="tablist"
            aria-label="Billing cycle"
            className="border-hairline bg-bone flex items-center gap-2 border p-1.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={cycle === 'yearly'}
              onClick={() => setCycle('yearly')}
              className={`px-4 py-2 font-sans text-[13px] font-semibold transition-colors ${
                cycle === 'yearly' ? 'bg-moss text-bone' : 'text-soil hover:text-ink'
              }`}
            >
              {t('toggle.yearly')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={cycle === 'monthly'}
              onClick={() => setCycle('monthly')}
              className={`px-4 py-2 font-sans text-[13px] font-medium transition-colors ${
                cycle === 'monthly' ? 'bg-moss text-bone font-semibold' : 'text-soil hover:text-ink'
              }`}
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
          <p className="text-soil font-sans text-sm">{t('footnote')}</p>
          <span className="bg-soil/30 hidden h-4 w-px md:block" aria-hidden />
          <a href="/pricing" className="text-moss hover:text-ink font-sans text-sm font-semibold">
            {t('compare_link')} →
          </a>
        </div>
      </div>
    </section>
  );
}
