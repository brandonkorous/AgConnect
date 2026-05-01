'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import { LocaleToggle } from './LocaleToggle';
import { ThemeToggle } from '@/components/primitives/ThemeToggle';

function buildLinks(locale: string) {
    return [
        { href: `/${locale}/workers`, key: 'for_workers' },
        { href: `/${locale}/employers`, key: 'for_employers' },
        { href: `/${locale}/how-it-works`, key: 'how_it_works' },
        { href: `/${locale}/pricing`, key: 'pricing' },
        { href: `/${locale}/partners#training-orgs`, key: 'training_orgs' },
        { href: `/${locale}/resources`, key: 'resources' },
    ] as const;
}

export function MobileMenu() {
    const t = useTranslations('landing.nav');
    const tUtility = useTranslations('landing.utility');
    const locale = useLocale();
    const links = buildLinks(locale);
    const themeLabels = {
        light: tUtility('theme.light'),
        dark: tUtility('theme.dark'),
        aria: tUtility('theme.label'),
    };
    const [open, setOpen] = useState(false);

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    return (
        <>
            <button
                type="button"
                aria-label={t('menu_open')}
                aria-expanded={open}
                onClick={() => setOpen(true)}
                className="btn btn-ghost btn-square md:hidden"
            >
                <FontAwesomeIcon icon={faBars} className="h-5 w-5" />
            </button>
            {open && (
                <div className="bg-base-100 fixed inset-0 z-50 flex flex-col">
                    <div className="flex items-center justify-between px-5 py-5">
                        <div className="flex items-center gap-3">
                            <LocaleToggle />
                            <span className="text-secondary/40 text-sm leading-4" aria-hidden>|</span>
                            <ThemeToggle labels={themeLabels} />
                        </div>
                        <button
                            type="button"
                            aria-label={t('menu_close')}
                            onClick={() => setOpen(false)}
                            className="btn btn-ghost btn-square"
                        >
                            <FontAwesomeIcon icon={faXmark} className="h-6 w-6" />
                        </button>
                    </div>
                    <nav className="flex flex-1 flex-col px-5 pt-8" aria-label="Main">
                        <ul className="menu menu-vertical gap-3 p-0 text-3xl">
                            {links.map((link) => (
                                <li key={link.key}>
                                    <a
                                        href={link.href}
                                        onClick={() => setOpen(false)}
                                        className="text-base-content hover:text-primary hover:bg-transparent font-serif font-medium"
                                    >
                                        {t(link.key)}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                    <div className="flex flex-col gap-3 px-5 pb-10">
                        <a
                            href={`/${locale}/worker/sign-up`}
                            onClick={() => setOpen(false)}
                            className="btn btn-primary btn-lg btn-block"
                        >
                            {t('cta_primary')}
                        </a>
                        <a
                            href={`/${locale}/sign-in`}
                            onClick={() => setOpen(false)}
                            className="btn btn-outline btn-primary btn-lg btn-block"
                        >
                            {t('signin')}
                        </a>
                    </div>
                </div>
            )}
        </>
    );
}
