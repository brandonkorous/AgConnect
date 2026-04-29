import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import { LocaleToggle } from './LocaleToggle';

export function UtilityBar() {
  const t = useTranslations('landing.utility');

  return (
    <div className="bg-ink hidden md:block">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-5 py-2.5 md:px-8 lg:px-20">
        <a
          href="#main"
          className="bg-honey text-ink absolute -top-10 left-2 z-50 px-3 py-2 text-sm font-semibold focus:top-2"
        >
          {t('skip')}
        </a>
        <div className="flex items-center gap-2">
          <span className="bg-honey size-1.5 shrink-0 rounded-full" aria-hidden />
          <span className="text-sage font-sans text-xs">{t('grant_aligned')}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faGlobe} className="text-honey h-3 w-3" />
            <LocaleToggle tone="bone" separator="·" />
          </div>
          <span className="text-sage/50 text-xs" aria-hidden>
            |
          </span>
          <a href="#employers" className="text-sage hover:text-bone font-sans text-xs">
            {t('for_employers')}
          </a>
          <span className="text-sage/50 text-xs" aria-hidden>
            |
          </span>
          <a href="mailto:support@agconn.com" className="text-sage hover:text-bone font-sans text-xs">
            {t('help')}
          </a>
        </div>
      </div>
    </div>
  );
}
