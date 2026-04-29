import { useTranslations } from 'next-intl';
import { ArrowRight } from '@/components/primitives/ArrowRight';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';

const tiles = [
  { id: 'workers', value: '2,400+', valueTone: 'honey' as const, italic: true },
  { id: 'wage', value: '$19.50', valueTone: 'bone' as const, italic: false },
  { id: 'retention', value: '87%', valueTone: 'honey' as const, italic: true },
  { id: 'certs', value: '1,180', valueTone: 'bone' as const, italic: false },
];

export function ImpactNumbers() {
  const t = useTranslations('landing.impact');

  return (
    <section className="bg-moss text-bone w-full">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-16 px-5 py-24 md:px-8 md:py-28 lg:px-20 lg:py-30">
        <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end lg:gap-16">
          <div className="flex max-w-[680px] flex-col gap-4">
            <EyebrowLabel tone="honey" withRule>
              {t('eyebrow')}
            </EyebrowLabel>
            <h2 className="font-serif text-[40px] font-medium leading-[1.05] tracking-[-0.03em] md:text-[52px] lg:text-[64px]">
              {t('headline.line1')}
              <br />
              {t('headline.line2')}
            </h2>
          </div>
          <p className="text-sage max-w-[380px] font-sans text-base leading-relaxed lg:pb-4">
            {t('body')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile, i) => (
            <div
              key={tile.id}
              className={`flex flex-col gap-3.5 px-8 py-9 ${
                i < tiles.length - 1 ? 'border-soil lg:border-r' : ''
              }`}
            >
              <p
                className={`font-serif text-[88px] font-light leading-none tracking-[-0.04em] md:text-[108px] lg:text-[128px] ${
                  tile.italic ? 'italic' : ''
                } ${tile.valueTone === 'honey' ? 'text-honey' : 'text-bone'}`}
              >
                {tile.value}
              </p>
              <p className="text-bone font-sans text-lg font-semibold">{t(`tile.${tile.id}.label`)}</p>
              <p className="text-sage font-sans text-sm leading-relaxed">
                {t(`tile.${tile.id}.body`)}
              </p>
            </div>
          ))}
        </div>

        <div className="border-soil flex flex-col items-start gap-4 border-t pt-6 lg:flex-row lg:items-center lg:gap-6">
          <p className="text-sage font-sans text-[13px]">{t('cta.dashboard')}</p>
          <a
            href="/impact"
            className="bg-honey text-ink hover:bg-bone inline-flex items-center gap-2 px-5 py-3 font-sans text-sm font-semibold"
          >
            <span>{t('cta.link')}</span>
            <ArrowRight size={14} stroke="#1F1B14" />
          </a>
          <p className="text-honey font-mono text-[11px] tracking-[0.06em] lg:ml-auto">
            {t('source')}
          </p>
        </div>
      </div>
    </section>
  );
}
