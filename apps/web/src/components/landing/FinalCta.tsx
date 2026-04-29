import { useTranslations } from 'next-intl';
import { ArrowRight } from '@/components/primitives/ArrowRight';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { WaitlistForm } from './WaitlistForm';

export function FinalCta() {
  const t = useTranslations('landing.final');

  return (
    <section id="final-cta" className="bg-moss text-bone relative w-full overflow-clip">
      <BackgroundSun />
      <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 gap-16 px-5 py-24 md:px-8 md:py-28 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:px-20 lg:py-30">
        <div className="flex flex-col gap-8">
          <EyebrowLabel tone="honey" withRule>
            {t('eyebrow')}
          </EyebrowLabel>
          <h2 className="font-serif tracking-[-0.035em]">
            <span className="text-bone block text-6xl font-light italic leading-none md:text-7xl lg:text-8xl">
              {t('headline.es')}
            </span>
            <span className="text-honey mt-3 block text-6xl font-semibold leading-none md:text-7xl lg:text-8xl">
              {t('headline.en')}
            </span>
          </h2>
          <p className="text-sage max-w-[520px] font-sans text-lg leading-relaxed">{t('body')}</p>
        </div>

        <div className="flex flex-col gap-5">
          <WorkerCard />
          <EmployerCard />
        </div>
      </div>
    </section>
  );
}

function WorkerCard() {
  const t = useTranslations('landing.final.workers');
  return (
    <div className="bg-bone flex flex-col gap-4 p-8">
      <p className="text-soil label">{t('eyebrow')}</p>
      <p className="text-ink font-serif text-[26px] font-semibold tracking-[-0.02em] leading-tight">
        {t('headline')}
      </p>
      <WaitlistForm
        audience="worker"
        title=""
        inputLabel={t('label')}
        inputPlaceholder={t('placeholder')}
        ctaText={t('cta')}
        helpText={t('help')}
        successText={t('success')}
      />
    </div>
  );
}

function EmployerCard() {
  const t = useTranslations('landing.final.employers');
  return (
    <div className="bg-ink border-soil flex flex-col gap-4 border p-8">
      <p className="text-honey label">{t('eyebrow')}</p>
      <p className="text-bone font-serif text-[26px] font-semibold tracking-[-0.02em] leading-tight">
        {t('headline')}
      </p>
      <a
        href="#post-job"
        className="bg-honey text-ink hover:bg-bone flex items-center justify-between px-5 py-3.5 font-sans text-[15px] font-bold"
      >
        <span>{t('cta')}</span>
        <ArrowRight size={16} stroke="#1F1B14" width={2} />
      </a>
      <p className="text-sage font-sans text-xs">{t('help')}</p>
    </div>
  );
}

function BackgroundSun() {
  return (
    <svg
      className="absolute top-20 right-20 opacity-40"
      width="280"
      height="280"
      viewBox="0 0 92 92"
      aria-hidden
    >
      <circle cx="46" cy="46" r="46" fill="#5C4326" />
      <path
        d="M46 18 C62 28 64 46 58 60 C52 70 46 76 46 76 C46 76 40 70 34 60 C28 46 30 28 46 18 Z"
        fill="#C8A24A"
      />
    </svg>
  );
}
