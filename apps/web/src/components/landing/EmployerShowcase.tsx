import { useTranslations } from 'next-intl';
import { ArrowRight } from '@/components/primitives/ArrowRight';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { EmployerDashboardMock } from './EmployerDashboardMock';

const bullets = ['1', '2', '3'] as const;

export function EmployerShowcase() {
  const t = useTranslations('landing.employer_showcase');

  return (
    <section id="employers" className="bg-bone w-full">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:px-20 lg:py-28">
        <div className="flex flex-col gap-7 lg:order-1">
          <EyebrowLabel tone="soil">{t('eyebrow')}</EyebrowLabel>
          <h2 className="text-ink font-serif text-[40px] font-medium leading-[1.05] tracking-tight md:text-[52px]">
            {t('headline')}
          </h2>
          <p className="text-ink/85 max-w-[520px] font-sans text-[17px] leading-relaxed">
            {t('body')}
          </p>

          <ul className="flex flex-col gap-5 pt-2">
            {bullets.map((b) => (
              <li
                key={b}
                className="border-soil/15 grid grid-cols-[120px_1fr] gap-6 border-t pt-5"
              >
                <h3 className="text-ink font-serif text-base font-semibold tracking-tight">
                  {t(`bullet${b}.title`)}
                </h3>
                <p className="text-ink/80 font-sans text-base leading-relaxed">
                  {t(`bullet${b}.body`)}
                </p>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3.5 pt-4">
            <a
              href="#pricing"
              className="bg-moss text-bone hover:bg-ink inline-flex items-center gap-2.5 px-7 py-4 font-sans text-base font-semibold"
            >
              <span>{t('cta.primary')}</span>
              <ArrowRight stroke="#EFE6D2" width={2} />
            </a>
            <a
              href="#pricing"
              className="border-moss text-moss hover:bg-moss hover:text-bone inline-flex items-center px-7 py-4 font-sans text-base font-semibold border-[1.5px]"
            >
              {t('cta.secondary')}
            </a>
          </div>
        </div>

        <div className="flex items-center justify-center lg:order-2 lg:justify-end">
          <EmployerDashboardMock />
        </div>
      </div>
    </section>
  );
}
