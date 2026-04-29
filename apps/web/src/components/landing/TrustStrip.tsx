import { useLocale, useTranslations } from 'next-intl';
import { partners } from '@/data/partners';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';

export function TrustStrip() {
  const t = useTranslations('landing.trust');
  const locale = useLocale();

  return (
    <section className="bg-bone border-soil/15 w-full border-y">
      <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-8 md:py-14 lg:px-20 lg:py-16">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-8">
          <div className="flex items-center gap-3.5">
            <span className="bg-soil/40 h-px w-8 shrink-0" aria-hidden />
            <EyebrowLabel tone="soil">{t('eyebrow')}</EyebrowLabel>
          </div>
          <p className="text-soil font-sans text-sm">{t('subtitle')}</p>
        </div>

        <ul className="grid grid-cols-3 items-center gap-x-2 gap-y-8 md:grid-cols-6">
          {partners.map((partner, i) => (
            <li
              key={partner.id}
              className="flex items-center justify-center"
              aria-label={locale === 'es' ? partner.altEs : partner.altEn}
            >
              <span className="text-soil/70 font-serif text-xl font-semibold tracking-tight md:text-2xl">
                {partner.abbreviation}
              </span>
              {i < partners.length - 1 && (
                <span
                  className="bg-soil/15 ml-2 h-9 w-px shrink-0 md:ml-4 hidden md:block"
                  aria-hidden
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
