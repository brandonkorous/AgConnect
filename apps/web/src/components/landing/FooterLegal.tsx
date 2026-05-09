import { useLocale, useTranslations } from 'next-intl';
import { CookiePreferencesLink } from './CookiePreferencesLink';

export function FooterLegal() {
    const t = useTranslations('landing.legal');
    const locale = useLocale();

    const links = [
        { key: 'privacy', href: `/${locale}/privacy` },
        { key: 'terms', href: `/${locale}/terms` },
        { key: 'subprocessors', href: `/${locale}/subprocessors` },
        { key: 'accessibility', href: `/${locale}/accessibility` },
        { key: 'sitemap', href: '/sitemap.xml' },
        { key: 'llms_txt', href: '/llms.txt' },
    ];

    return (
        <div className="bg-neutral text-neutral-content w-full">
            <div className="mx-auto flex flex-col items-start gap-3 px-5 py-6 md:flex-row md:items-center md:justify-between md:gap-6 md:px-8 lg:px-20">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-neutral-content/60 text-xs">
                    <span>{t('copyright')}</span>
                    <span aria-hidden className="opacity-60">|</span>
                    <span>{t('built_in')}</span>
                    <span aria-hidden className="opacity-60">|</span>
                    <a
                        href={`/${locale}/trust#status`}
                        className="badge badge-ghost badge-sm gap-1.5 border-0 hover:opacity-80"
                    >
                        <span>{t('status')}</span>
                    </a>
                </div>
                <ul className="text-neutral-content/60 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                    {links.map((l) => (
                        <li key={l.key}>
                            <a href={l.href} className="hover:text-neutral-content">
                                {t(l.key)}
                            </a>
                        </li>
                    ))}
                    <li>
                        <CookiePreferencesLink label={t('cookie_preferences')} />
                    </li>
                </ul>
            </div>
        </div>
    );
}
