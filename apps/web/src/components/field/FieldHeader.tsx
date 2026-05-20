'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { useClerk, useUser } from '@clerk/nextjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSun,
    faMoon,
    faRightFromBracket,
    faIdBadge,
} from '@fortawesome/free-solid-svg-icons';
import { Wordmark } from '@/components/primitives/Wordmark';
import { computeInitials } from '@/components/shell/UserMenu';
import {
    THEME_STORAGE_KEY,
    dataThemeFor,
    DEFAULT_THEME,
    type Theme,
} from '@/lib/theme';

type Props = {
    locale: string;
};

export function FieldHeader({ locale }: Props) {
    const t = useTranslations('worker.field.header');
    const pathname = usePathname();
    const otherLocale: 'en' | 'es' = locale === 'es' ? 'en' : 'es';

    const switchHref = (() => {
        const segments = pathname.split('/');
        if (segments[1] === 'en' || segments[1] === 'es') {
            segments[1] = otherLocale;
            return segments.join('/') || `/${otherLocale}`;
        }
        return `/${otherLocale}${pathname}`;
    })();

    return (
        <header className="bg-base-100 border-base-300 sticky top-0 z-20 flex h-14 items-center justify-between border-b px-3">
            <Link
                href={`/${locale}/field` as Route}
                aria-label={t('home_aria')}
                className="flex h-full items-center"
            >
                <Wordmark size="sm" tone="ink" />
            </Link>
            <div className="flex items-center gap-1.5">
                <ThemeToggleButton ariaLabel={t('theme_aria')} />
                <Link
                    href={switchHref as Route}
                    aria-label={t('switch_locale_aria', {
                        locale: otherLocale === 'en' ? t('lang_en') : t('lang_es'),
                    })}
                    className="btn btn-circle btn-ghost text-base-content/80 font-mono text-xs font-bold uppercase tracking-wide"
                >
                    {locale === 'es' ? t('lang_en') : t('lang_es')}
                </Link>
                <AccountButton
                    locale={locale}
                    labels={{
                        accountAria: t('account_aria'),
                        signedInAs: t('signed_in_as'),
                        profile: t('profile'),
                        signOut: t('sign_out'),
                    }}
                />
            </div>
        </header>
    );
}

// ---- Theme toggle (btn-circle) ---------------------------------------------

function readCurrentTheme(): Theme {
    if (typeof document === 'undefined') return DEFAULT_THEME;
    return document.documentElement.dataset.theme === 'tierra-dark' ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
    document.documentElement.setAttribute('data-theme', dataThemeFor(theme));
    document.documentElement.style.colorScheme = theme;
    try {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
        // localStorage may be denied (private mode); the DOM still updates.
    }
}

function ThemeToggleButton({ ariaLabel }: { ariaLabel: string }) {
    const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

    useEffect(() => {
        setTheme(readCurrentTheme());
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = (event: MediaQueryListEvent) => {
            const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
            if (stored === 'dark' || stored === 'light') return;
            const next: Theme = event.matches ? 'dark' : 'light';
            setTheme(next);
            document.documentElement.setAttribute('data-theme', dataThemeFor(next));
            document.documentElement.style.colorScheme = next;
        };
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, []);

    const isLight = theme === 'light';

    return (
        <button
            type="button"
            aria-label={ariaLabel}
            aria-pressed={!isLight}
            onClick={() => {
                const next: Theme = isLight ? 'dark' : 'light';
                setTheme(next);
                applyTheme(next);
            }}
            className="btn btn-circle btn-ghost text-base-content/80"
            suppressHydrationWarning
        >
            <FontAwesomeIcon
                icon={isLight ? faMoon : faSun}
                className="h-4 w-4"
                aria-hidden
            />
        </button>
    );
}

// ---- Account dropdown (btn-circle trigger) ---------------------------------

type AccountLabels = {
    accountAria: string;
    signedInAs: string;
    profile: string;
    signOut: string;
};

function AccountButton({ locale, labels }: { locale: string; labels: AccountLabels }) {
    const { isLoaded, isSignedIn, user } = useUser();
    const { signOut } = useClerk();
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function onClick(e: MouseEvent) {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    if (!isLoaded) {
        return (
            <div
                aria-hidden
                className="bg-base-200 border-base-300 h-12 w-12 animate-pulse rounded-full border"
            />
        );
    }
    if (!isSignedIn || !user) return null;

    const email = user.primaryEmailAddress?.emailAddress ?? null;
    const phone = user.primaryPhoneNumber?.phoneNumber ?? null;
    const identifier = email ?? phone ?? '';
    const initials = computeInitials(
        user.firstName ?? undefined,
        user.lastName ?? undefined,
        email,
        phone,
    );

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={labels.accountAria}
                className="btn btn-circle btn-primary text-xs font-bold"
            >
                {initials}
            </button>

            {open && (
                <div
                    role="menu"
                    className="bg-base-100 border-base-300 absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-2xl border shadow-lg"
                >
                    <div className="border-base-300 border-b px-4 py-3">
                        <div className="text-base-content/60 font-mono text-[10px] font-medium uppercase tracking-wider">
                            {labels.signedInAs}
                        </div>
                        <div className="text-base-content mt-1 truncate text-sm font-semibold">
                            {identifier}
                        </div>
                    </div>
                    <ul className="flex flex-col py-1">
                        <li>
                            <Link
                                href={`/${locale}/worker/profile` as Route}
                                onClick={() => setOpen(false)}
                                role="menuitem"
                                className="hover:bg-base-200 text-base-content/80 hover:text-base-content flex items-center gap-2.5 px-4 py-2.5 text-sm"
                            >
                                <FontAwesomeIcon
                                    icon={faIdBadge}
                                    className="text-base-content/50 h-3.5 w-3.5"
                                />
                                {labels.profile}
                            </Link>
                        </li>
                    </ul>
                    <div className="border-base-300 border-t">
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                setOpen(false);
                                signOut({ redirectUrl: `/${locale}` });
                            }}
                            className="hover:bg-base-200 text-error/90 hover:text-error flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold"
                        >
                            <FontAwesomeIcon icon={faRightFromBracket} className="h-3.5 w-3.5" />
                            {labels.signOut}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
