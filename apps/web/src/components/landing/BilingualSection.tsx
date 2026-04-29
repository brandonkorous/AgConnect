import { useTranslations } from 'next-intl';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';

const pillars = ['1', '2', '3'] as const;

export function BilingualSection() {
  const t = useTranslations('landing.bilingual');

  return (
    <section id="training-orgs" className="bg-sage w-full">
      <div className="mx-auto max-w-[1280px] px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
        <div className="mx-auto flex max-w-[760px] flex-col items-center gap-5 text-center">
          <EyebrowLabel tone="soil">{t('eyebrow')}</EyebrowLabel>
          <h2 className="text-ink font-serif text-[40px] font-medium leading-[1.05] tracking-tight md:text-[56px] lg:text-[64px]">
            <span className="italic">{t('headline.line1')}</span>
            <br />
            {t('headline.line2')}
          </h2>
          <p className="text-ink/85 max-w-[620px] font-sans text-[17px] leading-relaxed">
            {t('body')}
          </p>
        </div>

        <ul className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {pillars.map((p) => (
            <li
              key={p}
              className="border-ink/15 bg-bone flex flex-col gap-3 border p-8"
            >
              <h3 className="text-ink font-serif text-2xl font-medium leading-tight tracking-tight">
                {t(`pillar.${p}.title`)}
              </h3>
              <p className="text-ink/80 font-sans text-base leading-relaxed">
                {t(`pillar.${p}.body`)}
              </p>
              <BilingualMiniPreview index={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function BilingualMiniPreview({ index }: { index: '1' | '2' | '3' }) {
  if (index === '1') {
    return (
      <div className="border-soil/15 mt-3 grid grid-cols-2 border">
        <div className="bg-bone p-3">
          <p className="text-soil text-[10px] font-semibold tracking-[0.18em] uppercase">EN</p>
          <p className="text-ink mt-1 font-serif text-sm font-medium">Find work today</p>
        </div>
        <div className="bg-sage/60 p-3">
          <p className="text-soil text-[10px] font-semibold tracking-[0.18em] uppercase">ES</p>
          <p className="text-ink mt-1 font-serif text-sm font-medium">Encontrar trabajo hoy</p>
        </div>
      </div>
    );
  }
  if (index === '2') {
    return (
      <div className="border-soil/15 mt-3 flex flex-col gap-2 border bg-white p-3">
        <p className="text-soil font-mono text-[11px]">SMS · 9:14am</p>
        <p className="text-ink font-sans text-sm leading-snug">
          New job: Recolector de fresa · $18.50/hr · Madera. Reply YES to apply.
        </p>
      </div>
    );
  }
  return (
    <div className="border-soil/15 bg-ink mt-3 flex flex-col gap-1 border p-3">
      <p className="text-bone/70 text-[10px] font-semibold tracking-[0.18em] uppercase">
        Certificate · Certificado
      </p>
      <p className="text-bone font-serif text-base italic">Pesticide Handling</p>
      <p className="text-bone font-serif text-base">Manejo de pesticidas</p>
    </div>
  );
}
