import { useTranslations } from 'next-intl';
import { ArrowRight } from '@/components/primitives/ArrowRight';

const tiles = ['workers', 'wage', 'trainings', 'employers'] as const;

export function ImpactNumbers() {
  const t = useTranslations('landing.impact');

  return (
    <section className="bg-moss text-bone w-full">
      <div className="mx-auto max-w-[1280px] px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
        <div className="flex flex-col gap-6 pb-16 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3.5">
              <span className="bg-honey h-px w-8 shrink-0" aria-hidden />
              <span className="text-honey label">{t('eyebrow')}</span>
            </div>
            <h2 className="font-serif text-[40px] font-medium leading-[1.05] tracking-tight md:text-[56px] lg:text-[64px] max-w-[680px]">
              {t('headline')}
            </h2>
          </div>
          <p className="text-bone/80 max-w-[420px] font-sans text-[15px] leading-relaxed">
            {t('body')}
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-px bg-bone/10 lg:grid-cols-4">
          {tiles.map((tile) => (
            <li key={tile} className="bg-moss flex flex-col gap-3 p-6 md:p-8">
              <p className="text-bone/70 font-sans text-[12px] leading-snug">
                {t(`tile.${tile}.label`)}
              </p>
              <p className="text-bone font-mono text-[44px] font-medium leading-none md:text-[56px] lg:text-[64px]">
                {t(`tile.${tile}.value`)}
              </p>
              <p className="text-honey/80 mt-auto font-sans text-[12px]">
                {t(`tile.${tile}.caption`)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <p className="text-bone/80 font-sans text-sm">
            {t('cta.dashboard')}{' '}
            <a href="/impact" className="text-honey hover:text-bone inline-flex items-center gap-1 font-semibold">
              {t('cta.link')}
              <ArrowRight size={12} stroke="#C8A24A" />
            </a>
          </p>
          <p className="text-bone/40 font-mono text-[10px] tracking-[0.04em]">{t('source')}</p>
        </div>
      </div>
    </section>
  );
}
