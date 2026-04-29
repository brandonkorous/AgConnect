import { useTranslations } from 'next-intl';
import { LocaleToggle } from './LocaleToggle';

export function UtilityBar() {
  const t = useTranslations('landing.utility');

  return (
    <div className="border-soil/15 bg-bone hidden border-b md:block">
      <div className="mx-auto flex h-9 max-w-[1280px] items-center justify-between px-5 md:px-8 lg:px-20">
        <a
          href="#main"
          className="bg-honey text-ink absolute -top-10 left-2 z-50 px-3 py-2 text-sm font-semibold focus:top-2"
        >
          {t('skip')}
        </a>
        <LocaleToggle />
        <nav className="font-sans text-[13px] leading-4" aria-label="Utility links">
          <ul className="text-soil flex items-center gap-5">
            <li>
              <a href="#employers" className="hover:text-ink">
                {t('for_employers')}
              </a>
            </li>
            <li className="text-soil/40" aria-hidden>
              |
            </li>
            <li>
              <a href="mailto:support@agconn.com" className="hover:text-ink">
                {t('help')}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
