import { useTranslations } from 'next-intl';
import { ArrowRight } from '@/components/primitives/ArrowRight';
import { HeroPhoneMockup } from './HeroPhoneMockup';
import { HeroTrustStrip } from './HeroTrustStrip';

export function Hero() {
  const t = useTranslations('landing.hero');

  return (
    <section id="main" className="bg-bone w-full">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-5 pt-16 pb-20 md:px-8 md:pt-20 md:pb-24 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-10 lg:px-20 lg:pt-24 lg:pb-28">
        <div className="flex flex-col gap-9 lg:pt-6">
          <div className="bg-sage flex w-fit items-center gap-2.5 rounded-full px-3.5 py-1.5">
            <span className="bg-moss h-1.5 w-1.5 shrink-0 rounded-full" aria-hidden />
            <span className="text-moss font-sans text-[13px] leading-4 font-semibold tracking-[0.04em]">
              {t('now_serving')}
            </span>
          </div>

          <h1 className="text-ink font-serif tracking-[-0.045em]">
            <span className="block text-5xl font-light italic leading-[0.95] sm:text-6xl md:text-7xl lg:text-[72px] xl:text-[88px]">
              {t('headline.line1')}
            </span>
            <span className="text-moss block text-5xl font-semibold leading-[0.95] sm:text-6xl md:text-7xl lg:text-[72px] xl:text-[88px]">
              {t('headline.line2')}
            </span>
          </h1>

          <p className="text-ink max-w-xl font-sans text-lg leading-relaxed md:text-xl">
            {t('subhead')}
          </p>

          <div className="flex flex-wrap gap-3.5 pt-2">
            <a
              href="#final-cta"
              className="bg-moss text-bone hover:bg-ink inline-flex items-center gap-2.5 px-7 py-4 font-sans text-base font-semibold"
            >
              <span>{t('cta.primary')}</span>
              <ArrowRight stroke="#EFE6D2" width={2} />
            </a>
            <a
              href="#employers"
              className="border-moss text-moss hover:bg-moss hover:text-bone inline-flex items-center px-7 py-4 font-sans text-base font-semibold border-[1.5px]"
            >
              {t('cta.secondary')}
            </a>
          </div>

          <HeroTrustStrip />
        </div>

        <div className="flex items-center justify-center pt-6 lg:justify-end lg:pt-12">
          <HeroPhoneMockup />
        </div>
      </div>
    </section>
  );
}
