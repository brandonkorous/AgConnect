import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faCircleHalfStroke } from '@fortawesome/free-solid-svg-icons';
import { LocaleToggle } from './LocaleToggle';
import { ThemeToggle } from '@/components/primitives/ThemeToggle';

export function UtilityBar() {
    const t = useTranslations('landing.utility');
    const themeLabels = {
        light: t('theme.light'),
        dark: t('theme.dark'),
        aria: t('theme.label'),
    };

    return (
        <div className="bg-neutral">
            <div className="mx-auto flex items-center justify-between gap-4 px-5 py-2.5 md:gap-6 md:px-8 lg:px-20">
                <div className="hidden items-center gap-2 md:flex">
                    <span className="bg-accent size-1.5 shrink-0 rounded-full" aria-hidden />
                    <span className="text-neutral-content font-sans text-xs">{t('grant_aligned')}</span>
                </div>
                <div className="ml-auto flex items-center gap-3 md:ml-0 md:gap-4">
                    <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faGlobe} className="text-accent text-xs" />
                        <LocaleToggle tone="bone" separator="·" />
                    </div>
                    <span className="text-neutral-content/40 text-xs" aria-hidden>|</span>
                    <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faCircleHalfStroke} className="text-accent text-xs" />
                        <ThemeToggle tone="bone" separator="·" labels={themeLabels} />
                    </div>
                    <span className="hidden text-neutral-content/40 text-xs md:inline" aria-hidden>|</span>
                    <a href="#employers" className="link link-hover text-neutral-content hover:text-neutral-content hidden text-xs md:inline">
                        {t('for_employers')}
                    </a>
                    <span className="hidden text-neutral-content/40 text-xs md:inline" aria-hidden>|</span>
                    <a href="mailto:support@agconn.com" className="link link-hover text-neutral-content hover:text-neutral-content hidden text-xs md:inline">
                        {t('help')}
                    </a>
                </div>
            </div>
        </div>
    );
}
