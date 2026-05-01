'use client';

import { useEffect, useState } from 'react';
import { THEME_STORAGE_KEY, dataThemeFor, type Theme } from '@/lib/theme';

type Props = {
    tone?: 'soil' | 'bone';
    separator?: '|' | '·';
    labels: { light: string; dark: string; aria: string };
};

function readCurrentTheme(): Theme {
    if (typeof document === 'undefined') return 'light';
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

export function ThemeToggle({ tone = 'soil', separator = '|', labels }: Props) {
    const [theme, setTheme] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setTheme(readCurrentTheme());
        setMounted(true);

        // Track OS theme changes when the user hasn't pinned a choice
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

    const select = (next: Theme) => {
        setTheme(next);
        applyTheme(next);
    };

    const activeClass = tone === 'bone' ? 'text-neutral-content' : 'text-neutral-content';
    const inactiveClass =
        tone === 'bone' ? 'text-neutral-content/60 hover:text-neutral-content' : 'text-secondary hover:text-neutral-content';
    const dividerClass = tone === 'bone' ? 'text-neutral-content/40' : 'text-secondary/50';

    return (
        <div
            role="group"
            aria-label={labels.aria}
            className="flex items-center gap-2 font-sans text-sm leading-4"
        >
            <button
                type="button"
                onClick={() => select('light')}
                aria-pressed={mounted && theme === 'light'}
                className={`font-semibold ${mounted && theme === 'light' ? activeClass : inactiveClass}`}
            >
                {labels.light}
            </button>
            <span className={dividerClass} aria-hidden>
                {separator}
            </span>
            <button
                type="button"
                onClick={() => select('dark')}
                aria-pressed={mounted && theme === 'dark'}
                className={`font-semibold ${mounted && theme === 'dark' ? activeClass : inactiveClass}`}
            >
                {labels.dark}
            </button>
        </div>
    );
}
