export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'tierra:theme';
export const DEFAULT_THEME: Theme = 'light';

export function dataThemeFor(theme: Theme): string {
  return `tierra-${theme}`;
}

/**
 * Inline script that runs in <head> before the body paints, so the page never
 * shows the wrong theme during the React hydration window. Resolves the theme
 * in this order: stored choice → prefers-color-scheme → DEFAULT_THEME.
 *
 * Kept dependency-free (no JSX, no imports) and wrapped in an IIFE so nothing
 * leaks to window. If anything throws (storage denied, etc.) we fall through
 * to the default theme.
 */
export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var theme;
    if (stored === 'dark' || stored === 'light') {
      theme = stored;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark';
    } else {
      theme = ${JSON.stringify(DEFAULT_THEME)};
    }
    document.documentElement.setAttribute('data-theme', 'tierra-' + theme);
    document.documentElement.style.colorScheme = theme;
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'tierra-' + ${JSON.stringify(DEFAULT_THEME)});
  }
})();
`.trim();
