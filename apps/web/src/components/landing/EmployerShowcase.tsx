import { useTranslations } from 'next-intl';
import { EmployerDashboardMock } from './EmployerDashboardMock';

const bullets = [
  { id: '1', icon: ListIcon },
  { id: '2', icon: GridIcon },
  { id: '3', icon: HouseIcon },
] as const;

export function EmployerShowcase() {
  const t = useTranslations('landing.employer_showcase');

  return (
    <section id="employers" className="bg-ink text-bone w-full">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-start gap-16 px-5 py-24 md:px-8 md:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-20 lg:px-20 lg:py-30">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3.5">
            <span className="bg-honey h-px w-8 shrink-0" aria-hidden />
            <span className="text-honey label">{t('eyebrow')}</span>
          </div>
          <h2 className="font-serif text-[40px] font-medium leading-[1.05] tracking-[-0.03em] md:text-[52px] lg:text-[64px]">
            {t('headline')}
          </h2>
          <p className="text-sage max-w-[520px] font-sans text-lg leading-relaxed">{t('body')}</p>

          <ul className="flex flex-col gap-5 pt-2">
            {bullets.map(({ id, icon: Icon }) => (
              <li key={id} className="flex items-start gap-4">
                <span className="bg-honey flex size-12 shrink-0 items-center justify-center">
                  <Icon />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-bone font-serif text-xl font-semibold">
                    {t(`bullet${id}.title`)}
                  </h3>
                  <p className="text-sage font-sans text-[15px] leading-relaxed">
                    {t(`bullet${id}.body`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3.5 pt-2">
            <a
              href="#final-cta"
              className="bg-honey text-ink hover:bg-bone px-7 py-4 font-sans text-base font-semibold"
            >
              {t('cta.primary')}
            </a>
            <a
              href="mailto:sales@agconn.com"
              className="border-honey text-honey hover:bg-honey hover:text-ink border-[1.5px] px-7 py-4 font-sans text-base font-semibold"
            >
              {t('cta.secondary')}
            </a>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <EmployerDashboardMock />
        </div>
      </div>
    </section>
  );
}

function ListIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
      <path d="M3 6 H19 M3 11 H19 M3 16 H14" stroke="#1F1B14" strokeWidth="2" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
      <rect x="3" y="3" width="6" height="6" stroke="#1F1B14" strokeWidth="2" fill="none" />
      <rect x="13" y="3" width="6" height="6" stroke="#1F1B14" strokeWidth="2" fill="none" />
      <rect x="3" y="13" width="6" height="6" stroke="#1F1B14" strokeWidth="2" fill="none" />
      <rect x="13" y="13" width="6" height="6" fill="#1F1B14" />
    </svg>
  );
}

function HouseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
      <path d="M3 8 L11 3 L19 8 V18 H3 Z" stroke="#1F1B14" strokeWidth="2" fill="none" />
      <path d="M9 18 V12 H13 V18" stroke="#1F1B14" strokeWidth="2" />
    </svg>
  );
}
