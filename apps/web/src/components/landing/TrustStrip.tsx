import { useTranslations } from 'next-intl';

const partners = [
  { id: 'cdfa', italic: false },
  { id: 'f3', italic: true },
  { id: 'calosba', italic: false },
  { id: 'edd', italic: false },
  { id: 'eoc', italic: false },
  { id: 'crla', italic: true },
] as const;

export function TrustStrip() {
  const t = useTranslations('landing.trust');

  return (
    <section className="bg-bone-warm border-hairline w-full border-y">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-5 py-12 md:px-8 lg:px-20">
        <div className="flex items-center gap-4">
          <span className="text-moss font-serif text-base italic">{t('eyebrow')}</span>
          <span className="bg-soil h-px flex-1 shrink basis-0" aria-hidden />
          <span className="text-soil font-sans text-[13px] font-semibold tracking-[0.16em] uppercase">
            {t('subtitle')}
          </span>
        </div>

        <ul className="flex flex-wrap items-center justify-between gap-y-6 gap-x-8">
          {partners.map((p, i) => (
            <li key={p.id} className="flex items-center gap-8">
              <div className="flex flex-col items-start gap-1">
                <span
                  className={`text-moss font-serif text-2xl font-semibold tracking-[-0.02em] ${p.italic ? 'italic' : ''}`}
                >
                  {t(`partners.${p.id}.name`)}
                </span>
                <span className="text-soil font-sans text-[11px] tracking-[0.06em] uppercase">
                  {t(`partners.${p.id}.caption`)}
                </span>
              </div>
              {i < partners.length - 1 && (
                <span className="bg-soil/30 hidden h-9 w-px shrink-0 lg:block" aria-hidden />
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
