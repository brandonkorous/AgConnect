import { useTranslations } from 'next-intl';
import { WaitlistForm } from './WaitlistForm';

export function FinalCta() {
  const t = useTranslations('landing.final');

  return (
    <section id="final-cta" className="bg-bone w-full">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-10 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-[auto_1fr_minmax(0,1.1fr)] lg:gap-12 lg:px-20 lg:py-28">
        <SunMarkLarge />

        <div className="flex flex-col gap-4">
          <h2 className="font-serif tracking-tight">
            <span className="text-soil block text-5xl leading-none italic md:text-6xl lg:text-7xl">
              {t('headline.es')}
            </span>
            <span className="text-ink mt-2 block text-5xl leading-none font-semibold md:text-6xl lg:text-7xl">
              {t('headline.en')}
            </span>
          </h2>
          <p className="text-ink/80 mt-4 max-w-[420px] font-sans text-base leading-relaxed">
            {t('body')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:max-w-[540px]">
          <WaitlistForm
            audience="worker"
            title={t('workers.title')}
            inputLabel={t('workers.label')}
            inputPlaceholder={t('workers.placeholder')}
            ctaText={t('workers.cta')}
            helpText={t('workers.help')}
            successText={t('workers.success')}
          />
          <WaitlistForm
            audience="employer"
            title={t('employers.title')}
            inputLabel={t('employers.label')}
            inputPlaceholder={t('employers.placeholder')}
            ctaText={t('employers.cta')}
            helpText={t('employers.help')}
            successText={t('employers.success')}
          />
        </div>
      </div>
    </section>
  );
}

function SunMarkLarge() {
  return (
    <svg
      width="180"
      height="180"
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="hidden lg:block"
      aria-hidden
    >
      <circle cx="90" cy="90" r="88" stroke="#5C4326" strokeWidth="1.5" fill="none" />
      <path
        d="M90 30 C115 50 122 95 110 122 C100 142 90 152 90 152 C90 152 80 142 70 122 C58 95 65 50 90 30Z"
        fill="#C8A24A"
      />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const x1 = 90 + Math.cos(angle) * 92;
        const y1 = 90 + Math.sin(angle) * 92;
        const x2 = 90 + Math.cos(angle) * 100;
        const y2 = 90 + Math.sin(angle) * 100;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#5C4326"
            strokeWidth="1"
            strokeLinecap="square"
          />
        );
      })}
    </svg>
  );
}
