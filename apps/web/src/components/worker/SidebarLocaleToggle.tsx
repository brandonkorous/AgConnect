'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

export function SidebarLocaleToggle() {
    const locale = useLocale();
    const pathname = usePathname();
    const t = useTranslations('worker.dashboard.sidebar');

    const itemClass = (active: boolean) =>
        active
            ? 'bg-neutral text-neutral-content rounded-full px-2 py-1'
            : 'text-base-content/60 hover:text-base-content px-2 py-1';

    return (
        <div className="bg-base-200 inline-flex rounded-full p-0.5 font-mono text-[10px] font-bold">
            <Link
                href={pathname}
                locale="en"
                aria-current={locale === 'en' ? 'page' : undefined}
                className={itemClass(locale === 'en')}
            >
                {t('lang_en')}
            </Link>
            <Link
                href={pathname}
                locale="es"
                aria-current={locale === 'es' ? 'page' : undefined}
                className={itemClass(locale === 'es')}
            >
                {t('lang_es')}
            </Link>
        </div>
    );
}
