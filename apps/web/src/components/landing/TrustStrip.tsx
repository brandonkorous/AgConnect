import { useTranslations } from 'next-intl';

const partners = ['cdfa', 'f3', 'calosba', 'edd', 'eoc', 'crla'] as const;

export function TrustStrip() {
  const t = useTranslations('landing.trust');

  return (
    <section className="bg-base-200 border-base-300 w-full border-y">
      <div className="mx-auto flex flex-col gap-8 px-5 py-12 md:px-8 lg:px-20">
        <div className="flex items-center gap-4">
          <span className="text-primary label">{t('eyebrow')}</span>
          <span className="bg-secondary h-px flex-1 shrink basis-0" aria-hidden />
          <span className="text-secondary font-sans text-sm font-semibold tracking-widest uppercase">
            {t('subtitle')}
          </span>
        </div>

        <ul className="flex flex-wrap items-center justify-between gap-y-6 gap-x-8">
          {partners.map((id, i) => (
            <li key={id} className="flex items-center gap-8">
              <div className="flex flex-col items-start gap-1">
                <span className="text-primary font-serif text-2xl font-semibold tracking-tight">
                  {t(`partners.${id}.name`)}
                </span>
                <span className="text-secondary font-sans text-xs tracking-wider uppercase">
                  {t(`partners.${id}.caption`)}
                </span>
              </div>
              {i < partners.length - 1 && (
                <span className="bg-secondary/30 hidden h-9 w-px shrink-0 lg:block" aria-hidden />
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
