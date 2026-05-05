'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Wordmark } from '@/components/primitives/Wordmark';

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
        <header className="bg-base-100 border-base-300 sticky top-0 z-20 flex h-14 items-center justify-between border-b px-4">
            <Link
                href={`/${locale}/field` as Route}
                aria-label={t('home_aria')}
                className="flex h-full items-center"
            >
                <Wordmark size="sm" tone="ink" />
            </Link>
            <Link
                href={switchHref as Route}
                aria-label={t('switch_locale_aria', { locale: otherLocale === 'en' ? t('lang_en') : t('lang_es') })}
                className="border-base-300 text-base-content/80 hover:bg-base-200 active:bg-base-300 inline-flex h-11 min-w-[64px] items-center justify-center rounded-full border px-4 font-mono text-xs font-bold uppercase tracking-wide"
            >
                {locale === 'es' ? t('lang_en') : t('lang_es')}
            </Link>
        </header>
    );
}
