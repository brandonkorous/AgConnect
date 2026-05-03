'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { THEME_STORAGE_KEY, dataThemeFor, DEFAULT_THEME, type Theme } from '@/lib/theme';

type Props = {
    ariaLabel: string;
    className?: string;
};

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
        // localStorage may be unavailable (private mode, denied, etc.) — the toggle
        // still updates the DOM so the choice applies for this session.
    }
}

export function ThemeToggle({ ariaLabel, className }: Props) {
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
        <label className={`toggle text-base-content ${className ?? ''}`.trim()} aria-label={ariaLabel}>
            <input
                type="checkbox"
                checked={isLight}
                onChange={(event) => {
                    const next: Theme = event.target.checked ? 'light' : 'dark';
                    setTheme(next);
                    applyTheme(next);
                }}
                suppressHydrationWarning
            />
            <FontAwesomeIcon icon={faSun} size="xs" className="swap-on m-auto text-yellow-500" />
            <FontAwesomeIcon icon={faMoon} size="xs" className="swap-off m-auto text-gray-200" />
        </label>
    );
}
